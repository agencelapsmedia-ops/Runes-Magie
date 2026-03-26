import { prisma } from "@/lib/db";
import { format, parse, addMinutes, isBefore, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export interface TimeSlot {
  time: string;
  available: boolean;
  spotsLeft?: number;
}

async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.bookingSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

export async function getAvailableSlots(serviceId: string, dateStr: string, timezone: string): Promise<TimeSlot[]> {
  const service = await prisma.bookingService.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) return [];

  const totalDuration = service.durationMinutes + service.bufferMinutes;
  const targetDate = parse(dateStr, "yyyy-MM-dd", new Date());
  const dayOfWeek = targetDate.getDay();
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  const exception = await prisma.availabilityException.findFirst({
    where: { date: { gte: dayStart, lte: dayEnd } },
  });
  if (exception && !exception.isOpen) return [];

  let startTime: string, endTime: string;
  if (exception && exception.isOpen && exception.startTime && exception.endTime) {
    startTime = exception.startTime;
    endTime = exception.endTime;
  } else {
    const rules = await prisma.availabilityRule.findMany({
      where: { dayOfWeek, isActive: true, OR: [{ serviceId: null }, { serviceId }] },
    });
    if (rules.length === 0) return [];
    const rule = rules.find((r) => r.serviceId === serviceId) || rules[0];
    startTime = rule.startTime;
    endTime = rule.endTime;
  }

  const appointments = await prisma.appointment.findMany({
    where: { date: { gte: dayStart, lte: dayEnd }, status: { in: ["pending", "confirmed"] } },
  });

  const minHoursBefore = parseInt((await getSetting("booking_min_hours_before")) || "2");
  const now = toZonedTime(new Date(), timezone);

  const slots: TimeSlot[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let current = new Date(targetDate);
  current.setHours(startH, startM, 0, 0);
  const end = new Date(targetDate);
  end.setHours(endH, endM, 0, 0);

  while (current < end) {
    const slotEnd = addMinutes(current, service.durationMinutes);
    if (slotEnd > end) break;

    const slotTime = format(current, "HH:mm");
    const slotEndTime = format(slotEnd, "HH:mm");

    const slotDateTime = new Date(targetDate);
    slotDateTime.setHours(current.getHours(), current.getMinutes(), 0, 0);
    const minTime = addMinutes(now, minHoursBefore * 60);
    const isPast = isBefore(slotDateTime, minTime);

    const overlapping = appointments.filter((apt) => slotTime < apt.endTime && slotEndTime > apt.startTime);
    const spotsLeft = service.maxPerSlot - overlapping.length;
    const available = !isPast && spotsLeft > 0;

    slots.push({ time: slotTime, available, ...(service.maxPerSlot > 1 ? { spotsLeft: Math.max(0, spotsLeft) } : {}) });
    current = addMinutes(current, service.durationMinutes);
  }
  return slots;
}

export async function getMonthAvailability(serviceId: string, year: number, month: number, timezone: string): Promise<Record<string, boolean>> {
  const service = await prisma.bookingService.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) return {};

  const result: Record<string, boolean> = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  const rules = await prisma.availabilityRule.findMany({
    where: { isActive: true, OR: [{ serviceId: null }, { serviceId }] },
  });
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const exceptions = await prisma.availabilityException.findMany({
    where: { date: { gte: monthStart, lte: monthEnd } },
  });
  const now = toZonedTime(new Date(), timezone);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = format(date, "yyyy-MM-dd");
    if (isBefore(endOfDay(date), now)) { result[dateStr] = false; continue; }
    const dayException = exceptions.find((e) => new Date(e.date).getDate() === day);
    if (dayException && !dayException.isOpen) { result[dateStr] = false; continue; }
    const dayRules = rules.filter((r) => r.dayOfWeek === date.getDay());
    if (dayRules.length === 0 && !(dayException && dayException.isOpen)) { result[dateStr] = false; continue; }
    result[dateStr] = true;
  }
  return result;
}

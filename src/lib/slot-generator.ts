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

export async function getAvailableSlots(
  serviceId: string,
  dateStr: string,
  timezone: string
): Promise<TimeSlot[]> {
  // 1. Load service
  const service = await prisma.bookingService.findUnique({
    where: { id: serviceId },
  });
  if (!service || !service.isActive) return [];

  const totalDuration = service.durationMinutes + service.bufferMinutes;

  // 2. Parse date and get day of week
  const targetDate = parse(dateStr, "yyyy-MM-dd", new Date());
  const dayOfWeek = targetDate.getDay(); // 0=Sun, 6=Sat

  // 3. Check for exception on this date
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);
  const exception = await prisma.availabilityException.findFirst({
    where: {
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  if (exception && !exception.isOpen) {
    return []; // Day is blocked
  }

  // 4. Get availability rules
  let startTime: string;
  let endTime: string;

  if (exception && exception.isOpen && exception.startTime && exception.endTime) {
    startTime = exception.startTime;
    endTime = exception.endTime;
  } else {
    const rules = await prisma.availabilityRule.findMany({
      where: {
        dayOfWeek,
        isActive: true,
        OR: [{ serviceId: null }, { serviceId }],
      },
    });

    if (rules.length === 0) return [];

    // Use the most specific rule (service-specific > global)
    const rule = rules.find((r) => r.serviceId === serviceId) || rules[0];
    startTime = rule.startTime;
    endTime = rule.endTime;
  }

  // 5. Load existing appointments for this date
  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      status: { in: ["pending", "confirmed"] },
    },
  });

  // 6. Get min hours before setting
  const minHoursBefore = parseInt((await getSetting("booking_min_hours_before")) || "2");
  const now = toZonedTime(new Date(), timezone);

  // 7. Generate all possible slots
  const slots: TimeSlot[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let current = new Date(targetDate);
  current.setHours(startH, startM, 0, 0);

  const end = new Date(targetDate);
  end.setHours(endH, endM, 0, 0);

  while (current < end) {
    const slotEnd = addMinutes(current, service.durationMinutes);
    const slotEndWithBuffer = addMinutes(current, totalDuration);

    // Don't generate slot if it goes past end time
    if (slotEnd > end) break;

    const slotTime = format(current, "HH:mm");
    const slotEndTime = format(slotEnd, "HH:mm");

    // Check if slot is in the past or too close
    const slotDateTime = new Date(targetDate);
    slotDateTime.setHours(current.getHours(), current.getMinutes(), 0, 0);
    const minTime = addMinutes(now, minHoursBefore * 60);
    const isPast = isBefore(slotDateTime, minTime);

    // Check overlaps with existing appointments
    const overlapping = appointments.filter((apt) => {
      const aptStart = apt.startTime;
      const aptEnd = apt.endTime;
      return slotTime < aptEnd && slotEndTime > aptStart;
    });

    const spotsUsed = overlapping.length;
    const spotsLeft = service.maxPerSlot - spotsUsed;
    const available = !isPast && spotsLeft > 0;

    slots.push({
      time: slotTime,
      available,
      ...(service.maxPerSlot > 1 ? { spotsLeft: Math.max(0, spotsLeft) } : {}),
    });

    current = addMinutes(current, service.durationMinutes);
  }

  return slots;
}

export async function getMonthAvailability(
  serviceId: string,
  year: number,
  month: number,
  timezone: string
): Promise<Record<string, boolean>> {
  const service = await prisma.bookingService.findUnique({
    where: { id: serviceId },
  });
  if (!service || !service.isActive) return {};

  const result: Record<string, boolean> = {};
  const daysInMonth = new Date(year, month, 0).getDate();

  // Get all rules
  const rules = await prisma.availabilityRule.findMany({
    where: {
      isActive: true,
      OR: [{ serviceId: null }, { serviceId }],
    },
  });

  // Get all exceptions for this month
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const exceptions = await prisma.availabilityException.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  // Get appointment counts per day
  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
      status: { in: ["pending", "confirmed"] },
    },
  });

  const now = toZonedTime(new Date(), timezone);
  const minHoursBefore = parseInt(
    (await prisma.bookingSetting.findUnique({ where: { key: "booking_min_hours_before" } }))
      ?.value || "2"
  );

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();

    // Check if day is in the past
    if (isBefore(endOfDay(date), now)) {
      result[dateStr] = false;
      continue;
    }

    // Check exceptions
    const dayException = exceptions.find((e) => {
      const eDate = new Date(e.date);
      return eDate.getDate() === day;
    });

    if (dayException && !dayException.isOpen) {
      result[dateStr] = false;
      continue;
    }

    // Check rules
    const dayRules = rules.filter((r) => r.dayOfWeek === dayOfWeek);
    if (dayRules.length === 0 && !(dayException && dayException.isOpen)) {
      result[dateStr] = false;
      continue;
    }

    // Has at least some availability
    result[dateStr] = true;
  }

  return result;
}

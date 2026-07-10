'use client';

/** Bulle de la visiteuse : dégradé violet, alignée à droite. */
export default function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end pl-8">
      <div className="inline-block max-w-full whitespace-pre-line rounded-2xl rounded-br-md bg-gradient-to-br from-violet-royal to-violet-profond px-4 py-2.5 font-cormorant text-base leading-relaxed text-blanc-lune">
        {content}
      </div>
    </div>
  );
}

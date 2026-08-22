import { FileText, Video, ClipboardList, BookMarked, Link as LinkIcon, ExternalLink } from 'lucide-react';

const TYPE_ICON = {
  'Lecture Slides': FileText,
  'Past Questions': ClipboardList,
  Handout: BookMarked,
  Video: Video,
  'Reading List': BookMarked,
  Other: LinkIcon,
};

export default function CourseMaterials({ materials = [] }) {
  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
        <BookMarked className="h-9 w-9 text-navy-200" strokeWidth={1.5} />
        <p className="text-sm text-navy-400">No course materials match your filters yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {materials.map((m) => {
        const Icon = TYPE_ICON[m.resourceType] || LinkIcon;
        return (
          <a
            key={m._id}
            href={m.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card group flex flex-col p-5 transition hover:border-gold-400/60 hover:shadow-raised"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-gold-400">
                <Icon className="h-4 w-4" />
              </span>
              <ExternalLink className="h-4 w-4 text-navy-200 transition group-hover:text-navy-500" />
            </div>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gold-600">
              {m.courseCode} &middot; {m.resourceType}
            </p>
            <h4 className="mt-1 font-display text-sm font-bold leading-snug text-navy-900">
              {m.title}
            </h4>
            <p className="mt-1 text-xs text-navy-400">{m.courseName}</p>

            {m.description && (
              <p className="mt-2.5 line-clamp-2 text-sm text-navy-500">{m.description}</p>
            )}

            <div className="mt-auto flex items-center justify-between pt-4 text-xs text-navy-300">
              <span>
                Level {m.level} &middot; {m.semester}
              </span>
              <span>{m.uploadedBy?.name || 'Faculty'}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

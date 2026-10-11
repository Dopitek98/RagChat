import type { RetrievedContext } from "../types/types";

interface ContextTabProps {
  retrievedContext: RetrievedContext[];
}

function ContextTab({ retrievedContext }: ContextTabProps) {
  return (
    <aside className="fixed inset-y-0 right-0 z-20 hidden w-160 border-l border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-5 py-5">
          <h2 className="mt-1 text-lg font-semibold text-ink">
            Retrieved context
          </h2>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {retrievedContext.length === 0 ? (
            <p className="px-2 py-4 text-sm leading-6 text-slate-500">
              No retrieved context.
            </p>
          ) : (
            retrievedContext.map((context, index) => (
              <article
                key={`${context.source}-${context.fromLine}-${context.toLine}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
              >
                <a
                  href={context.source}
                  target="_blank"
                  rel="noreferrer"
                  className="line-clamp-2 text-sm font-medium leading-5 text-brand hover:underline"
                >
                  {context.source}
                </a>
                <p className="mt-1 text-xs font-bold text-black">
                  Lines {context.fromLine}-{context.toLine}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-ink">
                  {context.pageContent}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

export default ContextTab;

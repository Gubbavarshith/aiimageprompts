import { marked, Renderer } from 'marked'
import type { Tokens } from 'marked'

/** Toolbar + card wrapper for ```text``` fences (informative posts only). Keep prerender script in sync. */
function wrapPromptBlock(preHtml: string): string {
  return `<div class="blog-prompt-block">
  <div class="blog-prompt-block__toolbar" role="group" aria-label="Prompt actions">
    <span class="blog-prompt-block__label">Image prompt</span>
    <button type="button" class="blog-prompt-copy-btn" aria-label="Copy image prompt to clipboard">
      <svg class="blog-prompt-copy-btn__icon blog-prompt-copy-btn__icon--copy" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"></path></svg>
      <svg class="blog-prompt-copy-btn__icon blog-prompt-copy-btn__icon--check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
      <span class="blog-prompt-copy-btn__text">Copy</span>
    </button>
  </div>
  <div class="blog-prompt-block__body">${preHtml}</div>
</div>`
}

const defaultRendererCode = Renderer.prototype.code as (
  this: Renderer,
  token: Tokens.Code,
) => string

export function markdownToBlogHtml(
  content: string,
  options: { wrapPromptBlocks: boolean },
): string {
  const renderer = new Renderer()
  renderer.code = function code(this: Renderer, token: Tokens.Code) {
    const innerHtml = defaultRendererCode.call(this, token)
    const lang = (token.lang || '').trim().toLowerCase()
    if (options.wrapPromptBlocks && lang === 'text') {
      return wrapPromptBlock(innerHtml)
    }
    return innerHtml
  }

  const raw = marked.parse(content, { async: false, renderer })
  return typeof raw === 'string' ? raw : ''
}

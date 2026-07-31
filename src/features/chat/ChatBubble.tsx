/**
 * ChatBubble — 聊天气泡（Echo v2.0）
 *
 * - 用户气泡：右侧，暖杏色背景（#F5E6D3）
 * - AI 气泡：左侧，白色圆角 + 浅橙头像 + 极淡暖橙边框
 * - AI 回复下方有"为什么这样回？"链接
 * - loading 时显示打字机三点动画
 * - error 时显示重试按钮
 * - 展开时渲染 MirrorPanel / LabVersions
 */
import type { ChatMessage } from '@/types'
import HandDrawnIcon from '@/components/common/HandDrawnIcon'
import MirrorPanel from './MirrorPanel'
import LabVersions from './LabVersions'

interface Props {
  message: ChatMessage
  onToggleMirror: (id: string) => void
  onRetry?: (id: string) => void
}

/** 打字机三点（v2.0 使用 amber 色） */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber/50 [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber/50 [animation-delay:-0.1s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-amber/50" />
    </span>
  )
}

export default function ChatBubble({ message, onToggleMirror, onRetry }: Props) {
  const isUser = message.role === 'user'

  /* ===== 用户消息（v2.0：暖杏色气泡） ===== */
  if (isUser) {
    return (
      <div className="flex animate-fade-in-up justify-end">
        <div className="max-w-[78%] rounded-3xl rounded-tr-lg bg-apricot px-4 py-2.5 text-milkBrown shadow-soft">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {message.text}
          </p>
        </div>
      </div>
    )
  }

  // AI 消息
  const hasError = message.error

  return (
    <div className="flex animate-fade-in-up justify-start">
      <div className="w-full max-w-[85%]">
        <div className="flex items-start gap-2.5">
          {/* v2.0 圆形浅橙头像 */}
          <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber/60 shadow-soft">
            <HandDrawnIcon name="lamp" className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            {/* v2.0 白色圆角气泡 + 极淡暖橙边框 */}
            <div className="inline-block max-w-full rounded-3xl rounded-tl-lg border border-amber/15 bg-white px-4 py-2.5 shadow-soft">
              {hasError ? (
                <div className="flex items-center gap-2 text-milkBrown/60">
                  <span className="opacity-50 grayscale">
                    <HandDrawnIcon name="candle" className="h-5 w-5" />
                  </span>
                  <span className="text-sm">这盏灯好像闪了一下，没能回上来。</span>
                  {onRetry && (
                    <button
                      onClick={() => onRetry(message.id)}
                      className="ml-1 text-sm font-semibold text-milkBrown underline decoration-milkBrown/30 underline-offset-2 hover:decoration-milkBrown"
                    >
                      再试一次
                    </button>
                  )}
                </div>
              ) : message.text ? (
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-milkBrown">
                  {message.text}
                </p>
              ) : (
                <TypingDots />
              )}
            </div>

            {/* 为什么这样回？（v2.0 使用 milkBrown 色） */}
            {!hasError && message.mirror && (
              <div className="mt-1.5 pl-1">
                <button
                  onClick={() => onToggleMirror(message.id)}
                  className="group inline-flex items-center gap-1 text-xs font-medium text-milkBrown/50 underline decoration-milkBrown/20 decoration-1 underline-offset-2 transition-colors hover:text-milkBrown hover:decoration-milkBrown/40"
                >
                  <HandDrawnIcon
                    name="mirror"
                    className="h-3.5 w-3.5 transition-transform group-hover:scale-110"
                  />
                  为什么这样回？
                  <HandDrawnIcon
                    name="chevron-down"
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${
                      message.mirrorOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Mirror 面板：手风琴展开 */}
            {message.mirrorOpen && message.mirror && (
              <div
                className="grid transition-all duration-300 ease-soft"
                style={{
                  gridTemplateRows: message.mirrorOpen ? '1fr' : '0fr',
                }}
              >
                <div className="overflow-hidden">
                  <MirrorPanel data={message.mirror} />
                </div>
              </div>
            )}

            {/* Conversation Lab 多版本 */}
            {(message.labLoaded || message.labLoading) && (
              <LabVersions
                versions={message.labVersions || []}
                loading={message.labLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

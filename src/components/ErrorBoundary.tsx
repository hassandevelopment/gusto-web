import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 text-center bg-bg">
          <p className="font-extrabold text-accent-dark mb-2"
             style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
            Something went wrong
          </p>
          <p className="text-sm text-text-muted mb-6">Try refreshing the page</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-semibold text-accent-dark underline underline-offset-2 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

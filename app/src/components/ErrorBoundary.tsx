import React, { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    // Log to console in development
    console.error('ErrorBoundary caught:', error)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.retry) ?? (
          <div className="error-boundary">
            <p>Qualcosa è andato storto.</p>
            <button type="button" className="link" onClick={this.retry}>
              Riprova
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

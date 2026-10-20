import React from 'react';
import { AlertCircle, RefreshCw, Phone } from 'lucide-react';
import { CAMPUS_CONFIG } from '../../config/campusConfig';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Focus Academy Section ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-12 px-4 sm:px-6 max-w-4xl mx-auto my-8">
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8E2D8] p-6 sm:p-8 text-left shadow-editorial">
            <div className="flex items-center space-x-2 text-[#C2410C] font-code-mono text-[10px] uppercase font-bold tracking-wider mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>Diagnostic Safeguard Triggered</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#181614]">
              {this.props.title || 'Unable to display this curriculum module right now'}
            </h3>

            <p className="text-xs sm:text-sm text-[#57534E] mt-2 leading-relaxed">
              An unexpected render anomaly occurred in this section. Our academic counselors at the Thoramangalam campus are available directly to answer course queries and verify batch openings.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#181614] hover:bg-[#292524] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#FED7AA]" />
                <span>Reload Section</span>
              </button>

              <a
                href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-[#F4EFEA] text-[#181614] border border-[#E8E2D8] text-xs font-semibold rounded-xl transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>Call Campus Desk ({CAMPUS_CONFIG.contact.primaryPhone})</span>
              </a>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-code-mono text-[#78716C] hover:text-[#181614] cursor-pointer"
              >
                <span>Full Page Refresh →</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

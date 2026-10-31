import Link from "next/link";
import { ShieldCheck, ExternalLink, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base text-white">LakehouseFit AI</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                hackCBS
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              From Data Challenges to Evidence-Backed Decisions. Built for the hackCBS IOMETE Track to make enterprise data platforms transparent and verifiable.
            </p>
          </div>

          {/* Evaluation Principles */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Evaluation Methodology</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Deterministic capability matching</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Verified official documentation links</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Explicit Unknown & Validation statuses</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Zero AI hallucinations on product claims</span>
              </li>
            </ul>
          </div>

          {/* Official IOMETE Sources */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Official Documentation</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <a
                  href="https://iomete.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center space-x-1"
                >
                  <span>IOMETE Documentation Hub</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://iomete.com/docs/deployment"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center space-x-1"
                >
                  <span>Kubernetes & Helm Architecture</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://iomete.com/docs/user-guide/virtual-lakehouses"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center space-x-1"
                >
                  <span>Virtual Lakehouses & Apache Iceberg</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://iomete.com/docs/data-security/overview"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center space-x-1"
                >
                  <span>Apache Ranger Security & Governance</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Disclaimers & Ethics */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Limitations & Disclaimer</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              LakehouseFit AI is an objective decision-support tool. It does not claim guaranteed compatibility, performance, or financial savings. All claims must be verified via customer-specific technical proof of concept.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-slate-500 text-[11px]">
          <div>© {new Date().getFullYear()} LakehouseFit AI · hackCBS IOMETE Track Implementation</div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <span>Deterministic Core</span>
            <span>·</span>
            <span>Optional Server AI</span>
            <span>·</span>
            <span>Audit-Ready PDF Export</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


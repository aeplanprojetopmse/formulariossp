import React, { useRef } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Download,
  FileText,
  Upload,
  Calendar,
  Shield,
  HeartHandshake,
  Dumbbell,
  Check,
} from 'lucide-react';
import { ProjectData } from '../types';
import { downloadFppPdf } from '../services/pdfGenerator';

interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectData[];
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onImportProjects: (imported: ProjectData[]) => void;
}

export const ProjectListModal: React.FC<ProjectListModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSelectProject,
  onDeleteProject,
  onDuplicateProject,
  onImportProjects,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `propostas_fpp_ssp_se_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportProjects(parsed);
          alert(`${parsed.length} propostas importadas com sucesso!`);
        } else if (parsed && parsed.id) {
          onImportProjects([parsed]);
          alert('Proposta importada com sucesso!');
        }
      } catch (err) {
        alert('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  const getAreaBadge = (area: string) => {
    switch (area) {
      case 'MVI':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            <Shield className="w-3 h-3 text-red-600" /> MVI
          </span>
        );
      case 'EVM':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            <HeartHandshake className="w-3 h-3 text-purple-600" /> EVM
          </span>
        );
      case 'MQV':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Dumbbell className="w-3 h-3 text-emerald-600" /> MQV
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              <FolderOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Propostas de Projetos Salvas</h3>
              <p className="text-xs text-slate-400">
                Gerencie, duplique ou exporte propostas locais do FPP SSP/SE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nenhuma proposta encontrada. Crie uma nova proposta pelo botão superior.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => {
                const isSelected = p.id === currentProjectId;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          {getAreaBadge(p.areaTematica)}
                          <span className="font-mono text-xs text-slate-500 font-semibold">
                            {p.numeroProposta || 'Sem número'}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> Ativo
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 leading-snug">
                          {p.titulo || 'Sem título'}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {p.instituicao} • {p.lotacao || 'Lotação não especificada'}
                        </p>
                        {p.historicoEnvios && p.historicoEnvios.length > 0 && (
                          <div className="text-[11px] text-emerald-700 font-medium">
                            ✓ Enviado ao Google Apps Script em {p.historicoEnvios[p.historicoEnvios.length - 1].data}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-center">
                        {!isSelected && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProject(p.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                          >
                            Abrir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadFppPdf(p)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Baixar PDF direto"
                        >
                          <Download className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateProject(p.id)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Duplicar proposta"
                        >
                          <Copy className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          disabled={projects.length <= 1}
                          onClick={() => {
                            if (confirm('Deseja realmente excluir esta proposta?')) {
                              onDeleteProject(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 cursor-pointer"
                          title="Excluir proposta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer with backup features */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Backup (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Importar Backup</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

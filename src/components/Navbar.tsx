import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Plus,
  Send,
  Eye,
  Settings,
  FolderOpen,
  ChevronDown,
  Shield,
  HeartHandshake,
  Dumbbell,
  Check,
} from 'lucide-react';
import { ThematicArea, ProjectData } from '../types';

interface NavbarProps {
  currentProject: ProjectData;
  thematicArea: ThematicArea;
  onChangeArea: (area: ThematicArea) => void;
  onNewProject: (area: ThematicArea, blank?: boolean) => void;
  onOpenAiAssistant: () => void;
  onOpenPdfPreview: () => void;
  onOpenSettings: () => void;
  onOpenProjectList: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  thematicArea,
  onChangeArea,
  onNewProject,
  onOpenAiAssistant,
  onOpenPdfPreview,
  onOpenSettings,
  onOpenProjectList,
}) => {
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Banner with SSP Logo & Government Coat of Arms */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Institutional Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-900 border border-blue-400/30 flex items-center justify-center font-bold text-white shadow-inner">
            <span className="text-[11px] leading-tight text-center font-serif">
              SSP
              <br />
              <span className="text-[9px] text-amber-300">SE</span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Formulário de Proposta de Projeto (FPP)
              </h1>
              <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Portaria 1998/2025
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Secretaria de Estado da Segurança Pública • Governo de Sergipe
            </p>
          </div>
        </div>

        {/* Center / Right: Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* AI Generation Button */}
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-900/40 border border-indigo-400/30 transition-all cursor-pointer hover:scale-102"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">Criar com IA Gemini</span>
            <span className="md:hidden">IA</span>
          </button>

          {/* New Project Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNewDropdownOpen(!newDropdownOpen)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Novo Projeto</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {newDropdownOpen && (
              <div
                className="absolute right-0 mt-1.5 w-68 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-1 z-50 text-xs"
                onMouseLeave={() => setNewDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-700/60">
                  Criar Novo Formulário (Em Branco):
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNewProject('MVI', true);
                    setNewDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center gap-2 text-slate-200 cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Novo em Branco (MVI)</div>
                    <div className="text-[10px] text-slate-400">Mortes Violentas Intencionais</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNewProject('EVM', true);
                    setNewDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center gap-2 text-slate-200 cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Novo em Branco (EVM)</div>
                    <div className="text-[10px] text-slate-400">Violência contra a Mulher</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNewProject('MQV', true);
                    setNewDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/80 flex items-center gap-2 text-slate-200 cursor-pointer"
                >
                  <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Novo em Branco (MQV)</div>
                    <div className="text-[10px] text-slate-400">Qualidade de Vida Policial</div>
                  </div>
                </button>

                <div className="border-t border-slate-700/60 my-1"></div>
                <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Ou carregar exemplo de referência:
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNewProject(thematicArea, false);
                    setNewDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-700/80 text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-2 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Carregar Exemplo Preenchido ({thematicArea})</span>
                </button>
              </div>
            )}
          </div>

          {/* Project List / Switcher */}
          <button
            type="button"
            onClick={onOpenProjectList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Ver propostas salvas no navegador"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Propostas</span>
          </button>

          {/* PDF Preview & Dispatch (Primary Action) */}
          <button
            type="button"
            onClick={onOpenPdfPreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/30 transition-all cursor-pointer hover:scale-102"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Gerar PDF / Enviar à AEPLAN</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Configurações (Chave Gemini e Integração AEPLAN)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thematic Area Tabs Bar */}
      <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-1.5 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:inline">
              Área Temática do FPP:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChangeArea('MVI')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  thematicArea === 'MVI'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>MVI - Mortes Violentas</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeArea('EVM')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  thematicArea === 'EVM'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>EVM - Violência Mulher</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeArea('MQV')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  thematicArea === 'MQV'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>MQV - Qualidade de Vida</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 truncate max-w-sm hidden lg:block">
            <span className="text-slate-500">Editando:</span>{' '}
            <span className="text-slate-200 font-medium">{currentProject.titulo}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

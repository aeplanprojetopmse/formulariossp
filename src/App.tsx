import React, { useState, useEffect } from 'react';
import { ProjectData, ThematicArea } from './types';
import { TEMPLATES, TEMPLATE_MVI, TEMPLATE_EVM, TEMPLATE_MQV, createBlankProject } from './data/templates';
import { Navbar } from './components/Navbar';
import { ProjectForm } from './components/ProjectForm';
import { AiAssistantModal } from './components/AiAssistantModal';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { ProjectListModal } from './components/ProjectListModal';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEY = 'SSP_SE_FPP_PROJECTS_V2_BLANK';
const ACTIVE_ID_KEY = 'SSP_SE_FPP_ACTIVE_ID_V2';

export default function App() {
  const [projects, setProjects] = useState<ProjectData[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error('Falha ao carregar projetos do localStorage:', e);
        }
      }
    }
    // Delivered completely in blank form as requested by user
    return [createBlankProject('MVI')];
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedActive = localStorage.getItem(ACTIVE_ID_KEY);
      if (savedActive) return savedActive;
    }
    return projects[0]?.id || 'proj-init';
  });

  // Modal States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_ID_KEY, currentProjectId);
  }, [currentProjectId]);

  const currentProject =
    projects.find((p) => p.id === currentProjectId) || projects[0] || TEMPLATE_MVI;

  const handleUpdateProject = (updated: ProjectData) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleNewProject = (area: ThematicArea, blank: boolean = true) => {
    let newProject: ProjectData;

    if (blank) {
      newProject = createBlankProject(area);
    } else {
      const baseTemplate = TEMPLATES[area];
      newProject = {
        ...baseTemplate,
        id: `proj-${Date.now()}`,
        numeroProposta: `FPP-${area}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        titulo: `${baseTemplate.titulo} (Exemplo)`,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
      };
    }

    setProjects((prev) => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
  };

  const handleChangeArea = (area: ThematicArea) => {
    // Check if an existing project with this area exists
    const existing = projects.find((p) => p.areaTematica === area);
    if (existing) {
      setCurrentProjectId(existing.id);
    } else {
      handleNewProject(area, true);
    }
  };

  const handleApplyAiProposal = (generated: Partial<ProjectData>) => {
    const updated: ProjectData = {
      ...currentProject,
      ...generated,
      dataAtualizacao: new Date().toISOString(),
    };
    handleUpdateProject(updated);
  };

  const handleDuplicateProject = (id: string) => {
    const original = projects.find((p) => p.id === id);
    if (!original) return;

    const duplicated: ProjectData = {
      ...original,
      id: 'proj-' + Date.now(),
      numeroProposta: `${original.numeroProposta}-COPIA`,
      titulo: `${original.titulo} (Cópia)`,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };

    setProjects((prev) => [duplicated, ...prev]);
    setCurrentProjectId(duplicated.id);
  };

  const handleDeleteProject = (id: string) => {
    const remaining = projects.filter((p) => p.id !== id);
    if (remaining.length > 0) {
      setProjects(remaining);
      if (currentProjectId === id) {
        setCurrentProjectId(remaining[0].id);
      }
    }
  };

  const handleImportProjects = (imported: ProjectData[]) => {
    setProjects(imported);
    if (imported.length > 0) {
      setCurrentProjectId(imported[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Navigation Header */}
      <Navbar
        currentProject={currentProject}
        thematicArea={currentProject.areaTematica}
        onChangeArea={handleChangeArea}
        onNewProject={handleNewProject}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenPdfPreview={() => setIsPdfModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProjectList={() => setIsListModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        <ProjectForm
          project={currentProject}
          onChange={handleUpdateProject}
          onOpenAiAssistant={() => setIsAiModalOpen(true)}
          onOpenPdfPreview={() => setIsPdfModalOpen(true)}
        />
      </main>

      {/* Modals */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyProposal={handleApplyAiProposal}
        currentArea={currentProject.areaTematica}
      />

      <PdfPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        project={currentProject}
        onUpdateProject={handleUpdateProject}
      />

      <ProjectListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={(id) => setCurrentProjectId(id)}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onImportProjects={handleImportProjects}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Official State Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-center text-xs space-y-1">
        <p className="font-semibold text-slate-300">
          Secretaria de Estado da Segurança Pública • Governo do Estado de Sergipe
        </p>
        <p className="text-[11px] text-slate-500">
          Praça Tobias Barreto, 20, Bairro São José – Aracaju/SE • CEP: 49.015-130 • Fone: (79) 3216-5405 • E-mail: gabinete@ssp.se.gov.br
        </p>
      </footer>
    </div>
  );
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectData } from '../types';

export interface PdfGenerationResult {
  doc: jsPDF;
  blob: Blob;
  base64: string;
  dataUrl: string;
  fileName: string;
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function generateFppPdf(project: ProjectData): PdfGenerationResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const bottomMargin = 25;

  let currentY = 15;

  // Simple clean text header (no images)
  function drawFirstPageHeader() {
    // Top border line
    doc.setDrawColor(15, 45, 95);
    doc.setLineWidth(1);
    doc.line(marginLeft, 12, pageWidth - marginRight, 12);

    // Institution & Government texts
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 45, 95);
    doc.text('SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA', marginLeft, 18);

    doc.setFontSize(9.5);
    doc.text('GOVERNO DO ESTADO DE SERGIPE', pageWidth - marginRight, 18, { align: 'right' });

    // Subtle divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 22, pageWidth - marginRight, 22);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(10, 25, 55);
    doc.text('FORMULÁRIO DE PROPOSTA DE PROJETO (FPP)', pageWidth / 2, 29, {
      align: 'center',
    });

    currentY = 34;

    // Institutional identification table (Follows directly)
    const tableData = [
      [{ content: 'INSTITUIÇÃO: ' + (project.instituicao || 'Polícia Militar do Estado de Sergipe - PMSE / SSP'), colSpan: 2 }],
      [{ content: 'RESPONSÁVEL TÉCNICO DO PROJETO: ' + (project.responsavelTecnico || ''), colSpan: 2 }],
      [
        { content: 'POSTO/GRADUAÇÃO/CARGO: ' + (project.postoGraduacaoCargo || '') },
        { content: 'LOTAÇÃO: ' + (project.lotacao || '') },
      ],
      [
        { content: 'TELEFONE: ' + (project.telefone || '') },
        { content: 'E-MAIL: ' + (project.email || '') },
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 8,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        cellPadding: 2,
      },
      margin: { left: marginLeft, right: marginRight },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  function checkPageBreak(neededHeight: number) {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 20; // top margin on subsequent pages
    }
  }

  function renderSectionHeader(numeral: string, title: string) {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 45, 95);
    doc.text(`${numeral} ${title}`, marginLeft, currentY);
    currentY += 5;
  }

  function renderSectionParagraph(content: string) {
    const textToPrint = content || 'Não informado.';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);

    const lines = doc.splitTextToSize(textToPrint, contentWidth);
    const lineHeight = 4.2;
    const blockHeight = lines.length * lineHeight;

    checkPageBreak(blockHeight + 4);
    doc.text(lines, marginLeft, currentY);
    currentY += blockHeight + 5;
  }

  // Draw initial page
  drawFirstPageHeader();

  // I. OBJETIVO GERAL DA AQUISIÇÃO
  renderSectionHeader('I', 'OBJETIVO GERAL DA AQUISIÇÃO');
  renderSectionParagraph(project.objetivoGeral);

  // II. OBJETIVOS ESPECÍFICOS DA AQUISIÇÃO
  renderSectionHeader('II', 'OBJETIVOS ESPECÍFICOS DA AQUISIÇÃO');
  renderSectionParagraph(project.objetivosEspecificos);

  // III. JUSTIFICATIVA
  renderSectionHeader('III', 'JUSTIFICATIVA');
  renderSectionParagraph(project.justificativa);

  // IV. PÚBLICO-ALVO
  renderSectionHeader('IV', 'PÚBLICO-ALVO');
  const publicoAlvoText = `Público-alvo direto: ${project.publicoAlvoDireto || 'Não informado.'}\n\nPúblico-alvo indireto: ${project.publicoAlvoIndireto || 'Não informado.'}`;
  renderSectionParagraph(publicoAlvoText);

  // V. RESULTADOS ESPERADOS
  renderSectionHeader('V', 'RESULTADOS ESPERADOS');
  renderSectionParagraph(project.resultadosEsperados);

  // VI. METAS
  renderSectionHeader('VI', 'METAS');
  renderSectionParagraph(project.metas);

  // VII. SUSTENTABILIDADE DO PROJETO
  renderSectionHeader('VII', 'SUSTENTABILIDADE DO PROJETO');
  renderSectionParagraph(project.sustentabilidade);

  // VIII. MENSURAÇÃO DOS RESULTADOS ESPERADOS
  renderSectionHeader('VIII', 'MENSURAÇÃO DOS RESULTADOS ESPERADOS');
  renderSectionParagraph(project.mensuracaoResultados);

  // IX. PLANO DE LOCALIZAÇÃO
  renderSectionHeader('IX', 'PLANO DE LOCALIZAÇÃO');
  const localizacaoRows = (project.planoLocalizacao || []).map((loc) => [
    loc.item || '-',
    String(loc.quantidade || '-'),
    loc.endereco || '-',
  ]);

  if (localizacaoRows.length === 0) {
    localizacaoRows.push(['Sem itens cadastrados', '-', '-']);
  }

  checkPageBreak(25);
  autoTable(doc, {
    startY: currentY,
    head: [['ITEM', 'QUANTIDADE', 'ENDEREÇO']],
    body: localizacaoRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      font: 'helvetica',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [235, 240, 248],
      textColor: [15, 45, 95],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // X. MATERIAIS/SERVIÇOS
  renderSectionHeader('X', 'MATERIAIS/SERVIÇOS');

  // Introductory legal research parameters as formatted in official model
  const legalText =
    'Aqui será demonstrada a pesquisa de preços realizada, em conformidade com as diretrizes da Lei nº 14.133/2021 e da Portaria SSP nº 1998/2025, priorizando compras governamentais, atas do Sistema de Registro de Preços e no mínimo 03 (três) preços não discrepantes entre si.';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  const legalLines = doc.splitTextToSize(legalText, contentWidth);
  doc.text(legalLines, marginLeft, currentY);
  currentY += legalLines.length * 3.5 + 4;

  const materiaisRows = (project.materiaisServicos || []).map((m) => [
    m.materialServico || '-',
    m.descricaoSucinta || '-',
    m.modeloMarcaReferencia || '-',
    m.naturezaDespesa || '-',
    String(m.quantidade || '0'),
    formatCurrencyBRL(m.valorTotal || (m.quantidade * (m.valorUnitario || 0))),
  ]);

  const totalGeral = (project.materiaisServicos || []).reduce(
    (acc, m) => acc + (m.valorTotal || (m.quantidade * (m.valorUnitario || 0))),
    0
  );

  materiaisRows.push([
    { content: 'VALOR TOTAL ESTIMADO DA PROPOSTA', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } } as any,
    { content: formatCurrencyBRL(totalGeral), styles: { fontStyle: 'bold', halign: 'right' } } as any,
  ]);

  checkPageBreak(30);
  autoTable(doc, {
    startY: currentY,
    head: [[
      'Material/Serviço',
      'Descrição sucinta',
      'Modelo/Marca de Referência',
      'Natureza de Despesa',
      'Qtd',
      'Valor Total',
    ]],
    body: materiaisRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      font: 'helvetica',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [235, 240, 248],
      textColor: [15, 45, 95],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 26, halign: 'right' },
    },
    margin: { left: marginLeft, right: marginRight },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  if (project.pesquisaPrecosObservacoes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    const ppoLines = doc.splitTextToSize(
      `Observações da pesquisa de preços: ${project.pesquisaPrecosObservacoes}`,
      contentWidth
    );
    checkPageBreak(ppoLines.length * 3.5 + 3);
    doc.text(ppoLines, marginLeft, currentY);
    currentY += ppoLines.length * 3.5 + 4;
  }

  // XI. IMPLEMENTAÇÃO
  renderSectionHeader('XI', 'IMPLEMENTAÇÃO');
  renderSectionParagraph(project.implementacao);

  // XII. ANEXOS
  renderSectionHeader('XII', 'ANEXOS');
  renderSectionParagraph(project.anexos);

  // Signature Block
  checkPageBreak(30);
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  doc.text('Aracaju/SE, _____ de _________________ de 202___.', marginLeft, currentY);
  currentY += 16;
  doc.line(marginLeft, currentY, marginLeft + 90, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(project.responsavelTecnico || 'Responsável Técnico pelo Projeto', marginLeft, currentY);
  currentY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.text(project.postoGraduacaoCargo || 'Posto / Graduação / Cargo', marginLeft, currentY);

  // Draw Footer on EVERY page with official SSP Sergipe address and page numbering
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, pageHeight - 16, pageWidth - marginRight, pageHeight - 16);

    // Official address text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(70, 70, 70);
    doc.text(
      'Praça Tobias Barreto, 20, Bairro São José – Aracaju/SE',
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
    doc.text(
      'CEP: 49.015-130 - Fone: 79 3216-5405 - E-mail: gabinete@ssp.se.gov.br',
      pageWidth / 2,
      pageHeight - 8.5,
      { align: 'center' }
    );

    // Page number
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginRight, pageHeight - 8.5, {
      align: 'right',
    });
  }

  // Generate outputs
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1] || '';
  const dataUrl = doc.output('datauristring');
  
  // Clean file name
  const cleanTitle = (project.numeroProposta || 'FPP_SSP_SE')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanTitle}.pdf`;

  return {
    doc,
    blob,
    base64,
    dataUrl,
    fileName,
  };
}

export function downloadFppPdf(project: ProjectData): string {
  const result = generateFppPdf(project);
  result.doc.save(result.fileName);
  return result.fileName;
}

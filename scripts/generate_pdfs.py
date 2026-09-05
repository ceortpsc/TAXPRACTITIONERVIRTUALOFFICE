from pathlib import Path
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.colors import HexColor
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'output/pdf'; OUT.mkdir(parents=True,exist_ok=True)
docs=[('Platform-Operations-Manual.pdf',['docs/ARCHITECTURE.md','policies/EXECUTION-POLICY.md','runbooks/PRODUCTION-DEPLOYMENT.md']),('Refund-Casework-Manual.pdf',['docs/IRS-RECONCILIATION.md','runbooks/REFUND-CASEWORK.md']),('Andrea-Agent-Employee-Handbook.pdf',['resources/agents/ANDREA-SYSTEM-PROMPT.md','resources/agents/AGENT-OPERATIONS.md','resources/employees/EMPLOYEE-HANDBOOK.md'])]
styles=getSampleStyleSheet(); styles.add(ParagraphStyle(name='GoldHead',parent=styles['Heading1'],textColor=HexColor('#071a32'),fontSize=22,leading=27,spaceAfter=14)); styles.add(ParagraphStyle(name='Body2',parent=styles['BodyText'],fontSize=9.5,leading=14,textColor=HexColor('#25364d')))
def footer(canvas,doc):
 canvas.saveState();canvas.setStrokeColor(HexColor('#bc9650'));canvas.line(54,43,558,43);canvas.setFont('Helvetica',8);canvas.setFillColor(HexColor('#657184'));canvas.drawString(54,29,'ROSS TAX PRO SOFTWARE CO. | CONTROLLED OPERATING DOCUMENT');canvas.drawRightString(558,29,f'Page {doc.page}');canvas.restoreState()
for filename,sources in docs:
 story=[]
 for index,source in enumerate(sources):
  text=(ROOT/source).read_text(encoding='utf-8')
  if index: story.append(PageBreak())
  for raw in text.splitlines():
   line=raw.strip()
   if not line: story.append(Spacer(1,6));continue
   if line.startswith('# '): story.append(Paragraph(line[2:],styles['GoldHead']))
   elif line.startswith('## '): story.append(Paragraph(line[3:],styles['Heading2']))
   elif line.startswith('- '): story.append(Paragraph('• '+line[2:],styles['Body2']))
   elif line[0:2].isdigit() and '. ' in line[:4]: story.append(Paragraph(line,styles['Body2']))
   elif line.startswith('|'): continue
   else: story.append(Paragraph(line.replace('&','&amp;'),styles['Body2']))
 SimpleDocTemplate(str(OUT/filename),pagesize=LETTER,rightMargin=54,leftMargin=54,topMargin=54,bottomMargin=56,title=filename.replace('-',' ').replace('.pdf','')).build(story,onFirstPage=footer,onLaterPages=footer)

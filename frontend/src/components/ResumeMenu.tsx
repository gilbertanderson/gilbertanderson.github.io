import ChoiceMenu, { type Choice } from './ChoiceMenu';

type Props = { pdf?: string | null; docx?: string | null; label?: string; fontSize?: number };

/** One "Resume" control that lets the visitor pick the file format to download. */
export default function ResumeMenu({ pdf, docx, label = 'Resume', fontSize }: Props) {
  const choices: Choice[] = [];
  if (pdf) choices.push({ label: 'PDF', hint: 'best for reading and printing', href: pdf, download: true });
  if (docx) choices.push({ label: 'Word (.docx)', hint: 'editable', href: docx, download: true });
  return <ChoiceMenu label={label} choices={choices} fontSize={fontSize} />;
}

import fs from 'fs';
import path from 'path';

type Option = { label: string; is_correct: boolean };
type Question = {
  type: string;
  prompt: string;
  explanation: string;
  source_citation?: string;
  options: Option[];
};
type Lesson = {
  title: string;
  order_index: number;
  xp_reward: number;
  mastery_threshold: number;
  questions: Question[];
};
type TrackFile = {
  track: {
    title: string;
    slug: string;
    description?: string;
    icon?: string;
    order_index: number;
    is_published: boolean;
  };
  lessons: Lesson[];
};

function esc(value: string | undefined | null): string {
  if (value === undefined || value === null) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

function bool(value: boolean): number {
  return value ? 1 : 0;
}

const contentDir = path.join(__dirname, 'tracks');
const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.json'));

let sql = '';

for (const file of files) {
  const data: TrackFile = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf-8'));
  const t = data.track;

  sql += `INSERT INTO tracks (title, slug, description, icon, order_index, is_published) VALUES (${esc(t.title)}, ${esc(t.slug)}, ${esc(t.description)}, ${esc(t.icon)}, ${t.order_index}, ${bool(t.is_published)});\n`;

  for (const lesson of data.lessons) {
    sql += `INSERT INTO lessons (track_id, title, order_index, xp_reward, mastery_threshold) VALUES ((SELECT id FROM tracks WHERE slug = ${esc(t.slug)}), ${esc(lesson.title)}, ${lesson.order_index}, ${lesson.xp_reward}, ${lesson.mastery_threshold});\n`;

    for (const q of lesson.questions) {
      sql += `INSERT INTO questions (lesson_id, type, prompt, explanation, source_citation) VALUES ((SELECT id FROM lessons WHERE title = ${esc(lesson.title)} AND track_id = (SELECT id FROM tracks WHERE slug = ${esc(t.slug)})), ${esc(q.type)}, ${esc(q.prompt)}, ${esc(q.explanation)}, ${esc(q.source_citation)});\n`;

      q.options.forEach((opt, idx) => {
        sql += `INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES ((SELECT id FROM questions WHERE prompt = ${esc(q.prompt)} AND lesson_id = (SELECT id FROM lessons WHERE title = ${esc(lesson.title)} AND track_id = (SELECT id FROM tracks WHERE slug = ${esc(t.slug)}))), ${esc(opt.label)}, ${bool(opt.is_correct)}, ${idx});\n`;
      });
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql, 'utf-8');
console.log(`Generated seed.sql from ${files.length} track file(s).`);
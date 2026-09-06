import { PATHS } from '../config/paths.js?v=20260906-33';
import { element, pageHeader } from '../ui/components.js?v=20260906-33';
import { createNotesStore } from '../study/notes-store.js?v=20260906-33';
import { createLessonNotesPanel } from '../ui/lesson-notes-panel.js?v=20260906-33';
import { exportNotes } from '../study/notes-export.js?v=20260906-33';

export function renderNotesView() {
  const lessons = PATHS.flatMap(path => path.lessons);
  const store = createNotesStore();
  const view = element('section', {className:'content-page notes-page'}, [
    pageHeader('Il tuo quaderno', 'Le tue note.', 'Pensieri, collegamenti e idee. Ritrovali nel capitolo da cui sono nati.')
  ]);
  const select = element('select', {attrs:{id:'notes-lesson', 'aria-label':'Lezione delle note'}}, lessons.map(lesson =>
    element('option', {text:lesson.title,attrs:{value:lesson.id}})));
  const chapterSelect = element('select', {attrs:{id:'notes-chapter','aria-label':'Capitolo della nota'}});
  const chapterLink = element('a',{className:'button quiet',text:'Apri il capitolo'});
  const selector = element('div',{className:'notebook-selector'},[
    element('label',{text:'Lezione',attrs:{for:'notes-lesson'}}), select,
    element('label',{text:'Capitolo',attrs:{for:'notes-chapter'}}), chapterSelect, chapterLink
  ]);
  const body = element('div');
  const library = element('div',{className:'notes-library'},[selector, body]); view.append(library);
  let panel = null, chapters = [], sequence = 0;
  async function showLesson() {
    const current = ++sequence;
    panel?.destroy(); panel = null;
    const lesson = lessons.find(item => item.id === select.value) ?? lessons[0];
    if (!lesson) {body.replaceChildren(element('p',{text:'Nessuna lezione disponibile.'}));return;}
    body.replaceChildren(element('p',{text:'Apertura del quaderno…',attrs:{role:'status'}}));
    try {
      const response = await fetch(lesson.dataUrl); if (!response.ok) throw new Error();
      const model = await response.json(); if (current !== sequence) return;
      chapters = model.chapters ?? [];
      chapterSelect.replaceChildren(...chapters.map(chapter => element('option',{text:chapter.title,attrs:{value:chapter.id}})));
      const context = () => ({chapterId:chapterSelect.value,chapterTitle:chapters.find(c=>c.id===chapterSelect.value)?.title});
      panel = createLessonNotesPanel({lessonId:lesson.id,store,initialContext:context(),initialScope:"lesson",async onExport(notes) {
        if (!notes.length) return;
        await exportNotes({lesson:{...model,id:lesson.id},notes,async saveFile(blob,filename){
          const url=URL.createObjectURL(blob);const link=element('a',{href:url,attrs:{download:filename}});link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
        },async copyText(text){await navigator.clipboard.writeText(text);}});
      }});
      body.replaceChildren(panel.node); panel.node.querySelector('.lesson-notes-panel').dataset.open='true';
      chapterLink.setAttribute('href',`#/lessons/${lesson.id}/${chapterSelect.value}`);
    } catch { if(current===sequence) body.replaceChildren(element('p',{text:'Non riesco ad aprire la lezione. Le note restano salvate; riprova dai Percorsi.',attrs:{role:'alert'}})); }
  }
  select.value=lessons[0]?.id ?? '';
  select.addEventListener('change',showLesson);
  chapterSelect.addEventListener('change',()=>{
    panel?.setContext({chapterId:chapterSelect.value,chapterTitle:chapters.find(c=>c.id===chapterSelect.value)?.title,sectionId:null,sectionTitle:null});
    chapterLink.setAttribute('href',`#/lessons/${select.value}/${chapterSelect.value}`);
  });
  view.cleanup = () => {sequence++;panel?.destroy();};
  showLesson();return view;
}

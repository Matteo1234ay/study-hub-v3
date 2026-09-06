import { element, pageHeader } from '../ui/components.js?v=20260906-33';
import { createPreferencesStore } from '../study/preferences.js?v=20260906-33';
export function renderSettingsView() {
  const store=createPreferencesStore();
  const view=element('section',{className:'content-page'},[pageHeader('Il tuo spazio','A modo tuo.','Regola la lettura e il movimento. Le preferenze restano su questo dispositivo.')]);
  const status=element('p',{attrs:{role:'status'}});
  const panel=element('section',{className:'settings-panel'});
  for (const [key,label,options] of [
    ['fontSize','Dimensione del testo',[['small','Compatto'],['normal','Normale'],['large','Grande']]],
    ['width','Colonna di lettura',[['comfortable','Comoda'],['narrow','Stretta']]],
    ['motion','Movimento',[['system','Segui il dispositivo'],['reduced','Riduci il movimento']]]
  ]) {
    const select=element('select',{attrs:{id:`setting-${key}`,'aria-label':label}},options.map(([value,text])=>element('option',{text,attrs:{value}})));
    select.value=store.get()[key];
    select.addEventListener('change',()=>{try {store.update({[key]:select.value});store.applyTo(document.documentElement);status.textContent='Preferenze salvate.';}catch{status.textContent='Salvataggio non disponibile in questo browser.';}});
    panel.append(element('label',{text:label,attrs:{for:`setting-${key}`}}),select);
  }
  panel.append(element('div',{className:'reading-preview'},[element('p',{text:'La conoscenza prende forma quando trovi il tempo e lo spazio per farla tua.'})]),status);
  view.append(panel,element('a',{className:'button quiet',href:'#/progress',text:'Gestisci progressi e backup ↗'}));return view;
}

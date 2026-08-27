import test from "node:test";
import assert from "node:assert/strict";
import { createNotesStore } from "../src/study/notes-store.js";

function memoryStorage(){const data=new Map();return{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}

test("legacy chapter notes remain readable",()=>{const storage=memoryStorage();const store=createNotesStore(storage);store.set("SMM-01","old-chapter","testo vecchio");assert.equal(store.get("SMM-01","old-chapter"),"testo vecchio");});

test("structured notes keep chapter and section context",()=>{const store=createNotesStore(memoryStorage());const note=store.add("SMM-01",{chapterId:"macro-1",sectionId:"section-1",text:"mia nota"});assert.equal(store.list("SMM-01")[0].id,note.id);assert.equal(store.list("SMM-01")[0].sectionId,"section-1");});

test("text export never deletes notes",()=>{const store=createNotesStore(memoryStorage());store.add("SMM-01",{chapterId:"macro-1",sectionId:"section-1",text:"mia nota"});const exported=store.exportText("SMM-01","Lezione");assert.match(exported,/mia nota/);assert.equal(store.list("SMM-01").length,1);});

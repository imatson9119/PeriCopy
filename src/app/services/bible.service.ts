import { Injectable } from '@angular/core';
import bibleFile from 'src/assets/bible-esv-min.json';
import wordMapFile from 'src/assets/word_map.json';
import {
  IBible,
  BibleDiffNew,
  BookDiff,
  ChapterDiff,
  DiffType,
  VerseDiff,
  WordChange,
  WordMap,
  WordMapFile,
} from '../classes/models';
import { diffWords } from 'diff';
import { getWordChange, sanitizeText } from 'src/app/utils/utils';
import { Bible } from '../classes/Bible';

@Injectable({
  providedIn: 'root',
})
export class BibleService {
  bible: Bible;
  wordMap: WordMap = {};

  constructor() {
    for (let word in wordMapFile) {
      this.wordMap[word] = new Set((wordMapFile as WordMapFile)[word]);
    }
    this.bible = new Bible(bibleFile as IBible, this.wordMap);
  }


  getPassageTitle(start_loc: number, end_loc: number): string {
    return this.bible.getPassage(start_loc, end_loc).toString();
  }

  getBibleDiff(
    attempt: string,
    start_loc: number,
    end_loc: number
  ): BibleDiffNew | undefined {
    if (start_loc < 0 || end_loc < 0 || start_loc > end_loc) {
      return undefined;
    }
    let scripture = this.bible.getText(start_loc, end_loc);
    if (!scripture) {
      console.log('Error getting text');
      return undefined;
    }
    let diff: WordChange[] = getWordChange(
      diffWords(sanitizeText(scripture), sanitizeText(attempt), {
        ignoreCase: true,
        ignoreWhitespace: true,
      })
    );
    let scripture_arr = scripture.split(' ');
    let attempt_arr = attempt.split(' ');
    let original_Diff = diffWords(sanitizeText(scripture), sanitizeText(attempt), {
      ignoreCase: true,
      ignoreWhitespace: true,
    })
    console.log("original_Diff:\n", original_Diff)
    console.log("diff:\n", diff)
    console.log("scripture:\n", scripture);
    console.log("attempt:\n", attempt);
    console.log("Sanitized scripture:\n", sanitizeText(scripture));
    console.log("Sanitized attempt:\n", sanitizeText(attempt));
    console.log("scripture_arr:\n", scripture_arr);
    console.log("attempt_arr:\n", attempt_arr);
    let scripture_index = 0;
    let attempt_index = 0;
    let diff_index = 0;
    let change_index = 0;
    let cur_loc = start_loc;
    let done = false;
    let bibleDiff: BibleDiffNew = {
      m: this.bible.m,
      p: this.getPassageTitle(start_loc, end_loc) || '',
      i: start_loc,
      j: end_loc,
      v: [],
    };

    for (let book of this.bible.v) {
      if (cur_loc < book.m.i + book.m.l && !done) {
        let bookDiff: BookDiff = {
          m: book.m,
          v: [],
        };
        for (let chapter of book.v) {
          if (cur_loc < chapter.m.i + chapter.m.l && !done) {
            let chapterDiff: ChapterDiff = {
              m: chapter.m,
              v: [],
            };
            for (let verse of chapter.v) {
              if (cur_loc < verse.m.i + verse.m.l && !done) {
                let verseDiff: VerseDiff = {
                  m: verse.m,
                  v: [],
                };
                while (
                  cur_loc < verse.m.i + verse.m.l &&
                  diff_index < diff.length &&
                  change_index < diff[diff_index].v.length
                ) {
                  let diffType = diff[diff_index].t;
                  if (
                    verseDiff.v.length == 0 ||
                    diffType != verseDiff.v[verseDiff.v.length - 1].t
                  ) {
                    verseDiff.v.push({
                      t: diffType,
                      v: [],
                    });
                  }
                  if (diffType == DiffType.Added) {
                    verseDiff.v[verseDiff.v.length - 1].v.push(
                      attempt_arr[attempt_index]
                    );
                    attempt_index += 1;
                  } else if (diffType == DiffType.Removed) {
                    verseDiff.v[verseDiff.v.length - 1].v.push(
                      scripture_arr[scripture_index]
                    );
                    scripture_index += 1;
                    cur_loc += 1;
                  } else {
                    verseDiff.v[verseDiff.v.length - 1].v.push(
                      scripture_arr[scripture_index]
                    );
                    attempt_index += 1;
                    scripture_index += 1;
                    cur_loc += 1;
                  }
                  change_index += 1;
                  if (change_index == diff[diff_index].v.length) {
                    change_index = 0;
                    diff_index += 1;
                  }
                  if (diff_index == diff.length) {
                    done = true;
                    break;
                  }
                }
                chapterDiff.v.push(verseDiff);
              }
            }
            bookDiff.v.push(chapterDiff);
          }
        }
        bibleDiff.v.push(bookDiff);
      }
    }
    console.log("bibleDiff:\n", bibleDiff);
    return bibleDiff;
  }
}

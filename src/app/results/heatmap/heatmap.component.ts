import { Component } from '@angular/core';
import { Book, Chapter, DiffType, Heatmap } from 'src/app/classes/models';
import { BibleService } from 'src/app/services/bible.service';
import { StorageService } from 'src/app/services/storage.service';
import { IResult } from 'src/app/classes/models';
import { BiblePassage } from 'src/app/classes/BiblePassage';

enum FilterValues {
  PAST_DAY = 'Past Day',
  PAST_WEEK = 'Past Week',
  PAST_MONTH = 'Past Month',
  PAST_YEAR = 'Past Year',
  ALL_TIME = 'All Time',
}

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss'],
})
export class HeatmapComponent {
  book: Book = {} as Book;
  chapter: Chapter = {} as Chapter;
  filterValues = FilterValues;
  filterValue = FilterValues.ALL_TIME;
  heatmap: Heatmap = new Map();
  passage: BiblePassage = {} as BiblePassage;

  constructor(
    private _bibleService: BibleService,
    private _storageService: StorageService
  ) {
    let lastAttempt = this._storageService.getAttempts()[0];
    if (lastAttempt !== undefined) {
      let start = this._bibleService.bible.get(lastAttempt.diff.i);
      this.book = start.book;
      this.chapter = start.chapter;
      this.updateHeatmap();
    }
  }

  getBooks(): Book[] {
    return this._bibleService.bible.v;
  }

  resetChapter() {
    this.chapter = {} as Chapter;
  }

  isValidPassage(): boolean {
    return (
      this.book.m !== undefined &&
      this.chapter.m !== undefined &&
      this.chapter.m.i >= this.book.m.i &&
      this.chapter.m.i + this.chapter.m.l <= this.book.m.i + this.book.m.l
    );
  }

  getFilterTimestamp(): number {
    let now = new Date().getTime();
    switch (this.filterValue) {
      case FilterValues.PAST_DAY:
        return now - 24 * 60 * 60 * 1000;
      case FilterValues.PAST_WEEK:
        return now - 7 * 24 * 60 * 60 * 1000;
      case FilterValues.PAST_MONTH:
        return now - 30 * 24 * 60 * 60 * 1000;
      case FilterValues.PAST_YEAR:
        return now - 365 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }

  updateHeatmap() {
    if (!this.isValidPassage()) {
      return;
    }
    this.passage = new BiblePassage(
      this.chapter.m.i,
      this.chapter.m.i + this.chapter.m.l,
      this.book,
      this.chapter,
      this.chapter.v[0],
      this.book,
      this.chapter,
      this.chapter.v[this.chapter.v.length - 1]
    );
    let chapterStart = this.chapter.m.i;
    let chapterEnd = this.chapter.m.i + this.chapter.m.l;
    let filterTimestamp = this.getFilterTimestamp();
    let results: IResult[] = this._storageService.getAttempts().filter((a) => {
      return (
        a.timestamp > filterTimestamp &&
        ((a.diff.i >= chapterStart && a.diff.i <= chapterEnd) ||
          (a.diff.j >= chapterStart && a.diff.j <= chapterEnd) ||
          (a.diff.i < chapterStart && a.diff.j > chapterEnd))
      );
    });
    this.heatmap = new Map();
    for (let result of results) {
      this.updateHeatmapFromResult(result);
    }
    console.log('Initialized heatmap');
    console.log(this.heatmap);
  }



  updateHeatmapFromResult(result: IResult) {
    for (let bookDiff of result.diff.v) {
      if (this.book.m.b !== bookDiff.m.b) {
        continue;
      }
      for (let chapterDiff of bookDiff.v) {
        if (this.chapter.m.c !== chapterDiff.m.c) {
          continue;
        }
        for (let verseDiff of chapterDiff.v) {
          for (let wordDiff of verseDiff.v) {
            for (let i = 0; i < wordDiff.v.length; i++) {
              let curIndex =
                wordDiff.t === DiffType.Added ? wordDiff.i : wordDiff.i + i;
              let indexTotals = this.heatmap.get(curIndex);
              if (indexTotals === undefined) {
                indexTotals = [0, 0, 0];
                indexTotals[wordDiff.t] = 1;
                this.heatmap.set(curIndex, indexTotals);
              } else {
                indexTotals[wordDiff.t] += 1;
              }
            }
          }
        }
      }
    }
  }
}

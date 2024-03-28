import { createReference } from '../utils/utils';
import { Book, Chapter, Verse } from './models';

enum ReferenceLevel {
  BOOK = 0,
  CHAPTER = 1,
  VERSE = 2,
}

export class BiblePassage {
  i: number;
  j: number;
  b1: Book;
  c1: Chapter;
  v1: Verse;
  b2: Book;
  c2: Chapter;
  v2: Verse;
  startGranularity: ReferenceLevel;
  endGranularity: ReferenceLevel;
  commonality: number;
  constructor(
    i: number,
    j: number,
    b1: Book,
    c1: Chapter,
    v1: Verse,
    b2: Book,
    c2: Chapter,
    v2: Verse
  ) {
    if (i < 0 || j < 0 || i > j) {
      throw new Error('Invalid indices');
    }
    this.i = i;
    this.j = j;
    this.b1 = b1;
    this.c1 = c1;
    this.v1 = v1;
    this.b2 = b2;
    this.c2 = c2;
    this.v2 = v2;
    this.startGranularity =
      this.i === b1.m.i
        ? ReferenceLevel.BOOK
        : this.i === c2.m.i
        ? ReferenceLevel.CHAPTER
        : ReferenceLevel.VERSE
    this.endGranularity =
      this.j === b2.m.i + b2.m.l
        ? ReferenceLevel.BOOK
        : this.j === c2.m.i + c2.m.l
        ? ReferenceLevel.CHAPTER
        : ReferenceLevel.VERSE

    // 0: No commonality
    // 1: Commonality in book
    // 2: Commonality in chapter
    // 3: Commonality in verse
    this.commonality = this.b1 === this.b2 ? this.c1 === this.c2 ? this.v1 === this.v2 ? 3 : 2 : 1 : 0;
  }
  toString() {

    let startRef = [this.b1.m.b, this.c1.m.c.toString(), this.v1.m.v.toString()];
    let endRef = [this.b2.m.b, this.c2.m.c.toString(), this.v2.m.v.toString()];

    // How much of the start reference should be included in the output
    let startRefVerbosity: number = Math.max(this.startGranularity, this.endGranularity);

    // How much of the end reference should be included in the output. This is more complicated.
    let endRefVerbosity: number = Math.max(0,startRefVerbosity + 1 - this.commonality);
    console.log("startRefVerbosity", startRefVerbosity);
    console.log("endRefVerbosity", endRefVerbosity);


    let startRefText = "";
    let endRefText = "";

    startRefText = createReference(startRef, 0, startRefVerbosity);
    endRefText = endRefVerbosity === 0 ? "" : createReference(endRef, 3-endRefVerbosity-(2-startRefVerbosity), 2-(2-startRefVerbosity));

    return startRefText + (endRefText ? "-" + endRefText : "");
    
  }
}

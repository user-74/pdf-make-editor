import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as ace from "ace-builds";
import { createPdf } from "pdfmake/build/pdfmake";

const blankPNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  url: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
  fileName = '';
  fonts = {}

  @ViewChild("editor") private editor: ElementRef<HTMLElement> = {} as ElementRef;

  aceEditor: ace.Ace.Editor = {} as ace.Ace.Editor;

  constructor(public sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    const FONTS = `${window.location.origin}/assets/fonts`
    this.fonts = {
      Roboto: {
        normal: `${FONTS}/roboto/Roboto-Regular.ttf`,
        bold: `${FONTS}/roboto/Roboto-Medium.ttf`,
        italics: `${FONTS}/roboto/Roboto-Italic.ttf`,
        bolditalics: `${FONTS}/roboto/Roboto-MediumItalic.ttf`
      },
      Inter: {
        normal: `${FONTS}/inter/Inter-Regular.otf`,
        bold: `${FONTS}/inter/Inter-Medium.otf`,
        italics: `${FONTS}/inter/Inter-Italic.otf`,
        bolditalics: `${FONTS}/inter/Inter-MediumItalic.otf`
      }
    }
  }

  ngAfterViewInit(): void {
    ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.14.0/src-noconflict');

    this.aceEditor = ace.edit(this.editor.nativeElement);
    this.aceEditor.setOptions({
      fontSize: '14px',
      theme: 'ace/theme/monokai',
      mode: 'ace/mode/json'
    })

    if (!this.load()) {
      this.reset()
    }

    this.reload()
  }

  reload(): boolean {
    if (this.aceEditor.getSession().getAnnotations().some(item => item.type == "error")) {
      return false
    }

    const docDefinition = JSON.parse(this.aceEditor.getValue())
    this.placeholderImg(docDefinition)
    const pdfDocGenerator = createPdf(docDefinition, undefined, this.fonts);

    pdfDocGenerator.getDataUrl((dataUrl: string) => {
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
    })
    return true
  }

  minify() {
    this.aceEditor.session.setValue(JSON.stringify(JSON.parse(this.aceEditor.getValue())))
  }

  prettify() {
    this.aceEditor.session.setValue(JSON.stringify(JSON.parse(this.aceEditor.getValue()), null, '\t'));
  }

  download() {
    const blob = new Blob([this.aceEditor.getValue()], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    a.href = url;
    a.download = "file.json";
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  save() {
    const docDefinition = JSON.parse(this.aceEditor.getValue())
    localStorage.setItem("dd", JSON.stringify(docDefinition));
    this.reload()
  }

  reset() {
    const docDefinition = {
      pageSize: "letter",
      content: ["Test"],
      defaultStyle: {
        font: 'Inter'
      }
    }
    this.aceEditor.session.setValue(JSON.stringify(docDefinition, null, '\t'));
  }

  load(): boolean {
    const dd = localStorage.getItem("dd")
    if (!dd) {
      return false;
    }
    this.aceEditor.session.setValue(dd);
    return true;
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    if (files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(files[0]);
      reader.onload = () => {
        this.fileName = files[0].name;
        this.addBackgroundImg(reader.result as string)
      }
    }
  }

  addBackgroundImg(img: string) {
    const docDefinition = JSON.parse(this.aceEditor.getValue())

    docDefinition.background = [{
      image: img,
      width: 612
    }]
    this.aceEditor.session.setValue(JSON.stringify(docDefinition, null, '\t'))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placeholderImg(docDefinition: { [key: string]: any }) {
    const images = docDefinition["images"]
    if (images) {
      Object.keys(images)
        .filter((k: string) => images[k].startsWith("{{."))
        .forEach((k: string) => images[k] = blankPNG)
    }
  }

}

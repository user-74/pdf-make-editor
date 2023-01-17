import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as ace from "ace-builds";
import { createPdf } from "pdfmake/build/pdfmake";

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
    let docDefinition = {
      pageSize: "letter",
      content: ["Test"],
      defaultStyle: {
        font: 'Inter'
      }
    }

    this.aceEditor.setOptions({
      fontSize: '14px',
      theme: 'ace/theme/monokai',
      mode: 'ace/mode/json'
    })

    docDefinition.defaultStyle = { font: 'Inter' }

    const dd = localStorage.getItem("dd")
    if (dd) {
      console.log(dd)
      docDefinition = JSON.parse(dd)
    }
    this.aceEditor.session.setValue(JSON.stringify(docDefinition, null, '\t'));

    // this.aceEditor.session.on('change', () => this.reload())
    this.reload()
  }

  reload() {
    if (this.aceEditor.getSession().getAnnotations().some(item => item.type == "error")) {
      return
    }

    const docDefinition = JSON.parse(this.aceEditor.getValue())
    const pdfDocGenerator = createPdf(docDefinition, undefined, this.fonts);

    pdfDocGenerator.getDataUrl((dataUrl: string) => {
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
    })

    localStorage.setItem("dd", JSON.stringify(docDefinition));
  }

  generate() {
    this.reload()
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

  reset() {
    localStorage.removeItem("dd")
  }

}

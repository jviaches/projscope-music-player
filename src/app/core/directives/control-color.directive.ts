import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[control-color]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()'
  }
})
export class ControlHowerColorDirective {
  @Input('control-color') highlightColor: string;
  @Input() colorChangeDisabled: boolean;
  @Input() detectNoColorChange: boolean;

  private el: HTMLElement;

  constructor(el: ElementRef) { this.el = el.nativeElement; }

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.colorChangeDisabled) {
      this.highlight('var(--control-active-color)');
    } else {
      this.highlight('var(--theme-color)');
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {    
    if (!this.detectNoColorChange) {
      this.highlight('var(--control-active-color)');  
    }
  }

   private highlight(color: string) {
    this.el.style.color = color;
  }
}

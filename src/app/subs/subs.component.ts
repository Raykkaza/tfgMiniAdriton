import { Component, ElementRef, QueryList, ViewChildren, HostListener } from '@angular/core';

@Component({
  selector: 'app-suscripciones',
  templateUrl: './subs.component.html',
  styleUrls: ['./subs.component.css']
})
export class SubsComponent {
  plans = [
    {
      title: 'Plan Básico', img: 'basicPlan.jpg',
      points: ['Anamnesis y revisión cada 2 semanas.', 'Mejora de hábitos y composición corporal.', 'Resolución de dudas vía WhatsApp.'],
      price: 'Desde 60€/mes'
    },
    {
      title: 'Plan Atleta', img: 'atletaPlan.jpg',
      points: ['Revisión semanal.', 'Estrategias de rendimiento deportivo.', 'Cambios ilimitados en la dieta.'],
      price: 'Desde 90€/mes'
    },
    {
      title: 'Antropometría', img: 'antropoPlan.jpg',
      points: ['Medición de composición corporal.', 'Informe PDF con anatomía detallada.', 'Descuento a grupos (+3 personas).',],
      price: '50€/sesión'
    }
  ];

  /** refs alineadas con el *ngFor */
  @ViewChildren('media') mediaRefs!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('content') contentRefs!: QueryList<ElementRef<HTMLElement>>;

  /** abiertos (permite varios) */
  private open = new Set<number>();

  isOpen(i: number) { return this.open.has(i); }

  toggle(i: number) {
    const mediaEl = this.mediaRefs.get(i)?.nativeElement;
    const contentEl = this.contentRefs.get(i)?.nativeElement;
    if (!mediaEl || !contentEl) return;

    if (this.open.has(i)) {
      this.open.delete(i);
      this.collapse(contentEl);
      return;
    }

    // Posicionar el overlay justo bajo la imagen de ESTA card
    const top = mediaEl.offsetTop + mediaEl.offsetHeight;
    contentEl.style.top = `${top}px`;
    this.open.add(i);
    this.expand(contentEl);
  }

  /** Si redimensiona la ventana, re-colocamos los overlays abiertos */
  @HostListener('window:resize')
  onResize() {
    this.open.forEach(i => {
      const mediaEl = this.mediaRefs.get(i)?.nativeElement;
      const contentEl = this.contentRefs.get(i)?.nativeElement;
      if (!mediaEl || !contentEl) return;
      const top = mediaEl.offsetTop + mediaEl.offsetHeight;
      contentEl.style.top = `${top}px`;
      // si estaba auto, mantener abierto sin salto
      if (contentEl.style.height === 'auto') contentEl.style.height = 'auto';
    });
  }

  private expand(el: HTMLElement) {
    el.style.position = 'absolute';
    el.style.left = '1rem';
    el.style.right = '1rem';
    el.style.zIndex = '2';
    el.style.overflow = 'hidden';
    el.classList.add('open');

    // animación 0 -> altura real
    el.style.height = '0px';
    void el.offsetHeight;
    el.style.height = `${el.scrollHeight}px`;

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'height') return;
      el.style.height = 'auto';      // contenido variable sin saltos
      el.style.overflow = 'clip';
      el.removeEventListener('transitionend', onEnd);
    };
    el.addEventListener('transitionend', onEnd);
  }

  private collapse(el: HTMLElement) {
    el.style.overflow = 'hidden';
    el.style.height = `${el.scrollHeight}px`;
    void el.offsetHeight;
    el.classList.remove('open');
    el.style.height = '0px';

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'height') return;
      el.removeEventListener('transitionend', onEnd);
    };
    el.addEventListener('transitionend', onEnd);
  }
}

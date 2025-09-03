import { Component, ElementRef, QueryList, ViewChildren, HostListener, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';

type SubType = { sub_type_id: number; sub_type: string; sub_price: number; };
type Periodo = 'Mensual' | 'Trimestral';

@Component({
  selector: 'app-suscripciones',
  templateUrl: './subs.component.html',
  styleUrls: ['./subs.component.css']
})
export class SubsComponent implements OnInit {
  // === PLANES ===
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

  oneOffMode = false; // true si el tipo es Antropometría

  /** refs alineadas con el *ngFor */
  @ViewChildren('media') mediaRefs!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('content') contentRefs!: QueryList<ElementRef<HTMLElement>>;

  /** abiertos (permite varios) */
  private open = new Set<number>();
  isOpen(i: number) { return this.open.has(i); }

  // datos para el checkout ===
  subTypes: SubType[] = [];
  showModal = false;

  // selección
  selectedTypeId: number | null = null;
  selectedPeriodo: Periodo = 'Mensual';

  // calculados
  concepto = '';
  precioBase = 0;
  total = 0;
  meses = 1;
  subEndDate = '';

  // mensajes
  okMsg = '';
  errMsg = '';

  // IBAN placeholder
  ibanCliente = 'ES96 2100 7396 2113 0030 6258';

  // Email admin (ajústalo si quieres)
  adminEmail = 'adrianfernandezvento@gmail.com';

  constructor(private http: HttpClient, private notification: NotificationService) { }

  ngOnInit(): void {
    this.cargarTipos();
  }

  // === MÉTODOS DE EXPAND/COLLAPSE ===
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

  @HostListener('window:resize')
  onResize() {
    this.open.forEach(i => {
      const mediaEl = this.mediaRefs.get(i)?.nativeElement;
      const contentEl = this.contentRefs.get(i)?.nativeElement;
      if (!mediaEl || !contentEl) return;
      const top = mediaEl.offsetTop + mediaEl.offsetHeight;
      contentEl.style.top = `${top}px`;
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

    el.style.height = '0px';
    void el.offsetHeight;
    el.style.height = `${el.scrollHeight}px`;

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'height') return;
      el.style.height = 'auto';
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

  // ======= NUEVO: helpers de checkout =======
  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private usernameLS(): string {
    return localStorage.getItem('username') || 'Usuario';
  }

  private userEmailLS(): string {
    return localStorage.getItem('email') || ''; // ajusta la clave si guardas el email con otro nombre
  }

  private userIdLS(): number | null {
    const raw = localStorage.getItem('user_id');
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private cargarTipos(): void {
    this.http.get<SubType[]>('https://miniadritonff.com/api/get_sub_types.php', { headers: this.authHeaders() })
      .subscribe({
        next: (res) => this.subTypes = res,
        error: (e) => this.errMsg = e?.error?.error || 'No se pudieron cargar los planes.'
      });
  }

  // map plan index -> nombre en sub_types (sin tildes)
  private planIndexToTypeName(i: number): string {
    return i === 0 ? 'Basica' : i === 1 ? 'Atleta' : 'Antropometria';
  }

  // abrir modal desde un plan concreto
  abrirCheckoutDesdePlan(i: number): void {
    // intenta preseleccionar por nombre de tipo
    const wanted = this.planIndexToTypeName(i).toLowerCase();
    const found = this.subTypes.find(t => t.sub_type.toLowerCase() === wanted);
    this.selectedTypeId = found ? found.sub_type_id : (this.subTypes[0]?.sub_type_id ?? null);

    this.selectedPeriodo = 'Mensual';
    this.recalcular();
    this.abrirModal();
  }

  private abrirModal(): void {
    this.showModal = true;
    setTimeout(() => {
      const el = document.getElementById('subsModal');
      if (el) (window as any).bootstrap.Modal.getOrCreateInstance(el).show();
    }, 0);
  }

  cerrarModal(): void {
    const el = document.getElementById('subsModal');
    if (el) (window as any).bootstrap.Modal.getInstance(el)?.hide();
    this.showModal = false;
    this.okMsg = '';
    this.errMsg = '';
  }

  onChangeTipo(): void { this.recalcular(); }
  onChangePeriodo(): void { this.recalcular(); }

  private recalcular(): void {
    // tipo seleccionado
    const id = Number(this.selectedTypeId);
    const tipo = this.subTypes.find(t => t.sub_type_id === id);

    this.precioBase = tipo ? tipo.sub_price : 0;

    // Detectar Antropometría
    this.oneOffMode = !!tipo && tipo.sub_type_id === 3;

    if (this.oneOffMode) {
      // Pago único
      this.meses = 1;
      this.total = this.precioBase;

      // Fecha de fin = hoy (cumple la validación >= hoy)
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      this.subEndDate = d.toISOString().slice(0, 10);

    } else {
      // Suscripción normal
      this.meses = this.selectedPeriodo === 'Mensual' ? 1 : 3;
      this.total = this.precioBase * this.meses;

      // Fecha de fin = hoy + meses
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setMonth(end.getMonth() + this.meses);
      this.subEndDate = end.toISOString().slice(0, 10);
    }

    // Concepto
    const now = new Date();
    const mesAnio = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const tipoNombre = tipo ? tipo.sub_type : '—';
    const periodoLabel = this.oneOffMode ? 'Pago único' : this.selectedPeriodo;

    this.concepto = `${this.usernameLS()} - ${tipoNombre} - ${periodoLabel} - ${this.capFirst(mesAnio)}`;
  }


  private capFirst(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  confirmar(): void {
    this.okMsg = '';
    this.errMsg = '';

    if (!this.selectedTypeId) {
      this.errMsg = 'Elige un tipo de suscripción.';
      return;
    }

    const payload = {
      sub_type_id: this.selectedTypeId,
      sub_end_date: this.subEndDate
    };

    this.http.post<any>('https://miniadritonff.com/api/create_subscription.php', payload, { headers: this.authHeaders() })
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.okMsg = 'Solicitud enviada. El administrador revisará tu suscripción.';

            // ========= ENVÍO DE EMAILS =========
            const tipo = this.subTypes.find(t => t.sub_type_id === Number(this.selectedTypeId));
            const subTypeNombre = tipo ? tipo.sub_type : '—';
            const periodoLabel = this.oneOffMode ? 'Pago único' : this.selectedPeriodo;

            const subNoti = {
              usuarioEmail: this.userEmailLS(),
              usuarioNombre: this.usernameLS(),
              administradorEmail: this.adminEmail,
              subTypeNombre,
              periodoLabel,
              totalEuros: this.total,
              endDateISO: this.subEndDate,
              concepto: this.concepto
            };

            // Aviso al usuario
            this.notification.notifyUserSubscription('SUB_SOLICITADA', subNoti).subscribe({
              error: (e) => console.error('Email usuario (sub) falló:', e)
            });

            // Aviso al admin
            this.notification.notifyAdminNuevaSubSolicitud(subNoti)?.subscribe({
              error: (e) => console.error('Email admin (sub) falló:', e)
            });
            // ====================================

            // ========= CREAR PAYMENT (best-effort) =========
            const uid = this.userIdLS();
            if (uid) {
              const paymentPayload = {
                user_id: uid,
                payment_amount: Number(this.total.toFixed(2)), // el endpoint acepta payment_amount o payment_ammount
                payment_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
                payment_concept: this.concepto
              };
              this.http.post<any>('https://miniadritonff.com/api/create_payment.php', paymentPayload, { headers: this.authHeaders() })
                .subscribe({
                  next: () => { /* ok, sin UI */ },
                  error: (e) => {
                    console.warn('No se pudo crear el payment ', e?.error || e);
                  }
                });
            } else {
              console.warn('No se pudo crear el payment: user_id no disponible en localStorage.');
            }
            // ==============================================

            setTimeout(() => this.cerrarModal(), 1200);
          } else {
            this.errMsg = res?.error || 'No se pudo crear la suscripción.';
          }
        },
        error: (e) => {
          this.errMsg = e?.error?.error || 'Error al crear la suscripción.';
        }
      });

  }
}

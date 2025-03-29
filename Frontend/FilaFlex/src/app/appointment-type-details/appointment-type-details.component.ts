import { Component, OnInit } from '@angular/core';
import { AppointmentType, AppointmentTypeService } from '../services/appointment-type.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QueueService, AppointmentResponse } from '../services/queue.service';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-appointment-type-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-type-details.component.html',
  styleUrl: './appointment-type-details.component.css'
})

export class AppointmentTypeDetailsComponent implements OnInit {
  appointmentType: AppointmentType | null = null;
  loading: boolean = true;
  error: string | null = null;
  showQueue: boolean = false;
  queue: AppointmentResponse[] = [];
  loadingQueue: boolean = false;
  queueError: string | null = null;
  showRepositionDialog = false;
  selectedAppointment: AppointmentResponse | null = null;
  newPosition: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentTypeService: AppointmentTypeService,
    private queueService: QueueService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const name = this.route.snapshot.paramMap.get('name');
    if (name) {
      this.loadAppointmentTypeDetails(name);
    } else {
      this.error = "Nome do serviço não especificado";
      this.loading = false;
    }
  }

  loadAppointmentTypeDetails(name: string) {
    this.appointmentTypeService.getAppointmentTypeByName(name)
      .subscribe({
        next: (data) => {
          console.log('Dados completos recebidos:', data);
          if (data.adress) {
            console.log('Endereço encontrado:', data.adress);
          } else {
            console.log('Endereço não encontrado na resposta');
          }
          this.appointmentType = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = "Erro ao carregar detalhes do serviço";
          this.loading = false;
          console.error('Erro:', err);
        }
      });
  }

  repositionAppointment(): void {
    if (!this.selectedAppointment || !this.newPosition) {
      return;
    }
    
    this.loadingQueue = true;
    
    this.queueService.reorderQueue(this.selectedAppointment.id, this.newPosition)
      .subscribe({
        next: (response) => {
          console.log('Agendamento reposicionado com sucesso:', response);
          // Recarregar a fila para mostrar a nova ordem
          this.loadQueue();
          this.showRepositionDialog = false;
          this.selectedAppointment = null;
        },
        error: (error) => {
          console.error('Erro ao reposicionar agendamento:', error);
          this.queueError = 'Erro ao reposicionar agendamento. Tente novamente.';
          this.loadingQueue = false;
          this.showRepositionDialog = false;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
  
  scheduleAppointment(): void {
    if (!this.appointmentType) {
      console.error('appointmentType é nulo');
      return;
    }
    
    const appointmentTypeId = this.appointmentTypeService.getAppointmentTypeId(this.appointmentType);
    
    if (appointmentTypeId) {
      console.log('Navegando para agendamento com ID:', appointmentTypeId);
      this.router.navigate(['/appointment-scheduling'], {
        queryParams: {
          id: appointmentTypeId,
          name: this.appointmentType.name
        }
      });
    } else {
      console.error('ID inválido, usando apenas o nome');
      this.router.navigate(['/appointment-scheduling'], {
        queryParams: { name: this.appointmentType.name }
      });
    }
  }

  isAdmin(): boolean {
    const userRole = localStorage.getItem('userRole');
    console.log('userRole:', userRole);
    
    return userRole === 'ADMIN';
  }

  //Alternar visibilidade da fila e carregar dados quando necessário.
  toggleQueueView(): void {
    this.showQueue = !this.showQueue;
    
    if (this.showQueue && (!this.queue || this.queue.length === 0)) {
      this.loadQueue();
    }
  }

  //Carregar a fila usando o serviço.
  loadQueue(): void {
    if (!this.appointmentType || !this.appointmentType.name) {
      this.queueError = "Nome do serviço não disponível";
      return;
    }
    
    this.loadingQueue = true;
    this.queueError = null;
    
    this.queueService.getQueueByAppointmentType(this.appointmentType.name)
      .subscribe({
        next: (response) => {
          this.queue = response;
          this.loadingQueue = false;
        },
        error: (error) => {
          console.error('Erro ao carregar fila:', error);
          this.queueError = "Não foi possível carregar a fila de agendamentos.";
          this.loadingQueue = false;
        }
      });
  }

  openRepositionDialog(appointment: AppointmentResponse): void {
    this.selectedAppointment = appointment;
    this.newPosition = appointment.queueOrder || 1;
    this.showRepositionDialog = true;
  }
  
  cancelRepositioning(): void {
    this.showRepositionDialog = false;
    this.selectedAppointment = null;
  }

  
}
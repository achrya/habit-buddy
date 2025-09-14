import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ImportModalComponent, DuplicateAction } from './import-modal.component';

describe('ImportModalComponent', () => {
  let component: ImportModalComponent;
  let fixture: ComponentFixture<ImportModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportModalComponent, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit importWithAction event with selected action', () => {
    spyOn(component.importWithAction, 'emit');
    component.selectedAction = 'replace';
    component.onImport();
    expect(component.importWithAction.emit).toHaveBeenCalledWith('replace');
  });

  it('should format duplicate list correctly', () => {
    component.duplicates = ['Habit 1', 'Habit 2'];
    const result = component.getDuplicateList();
    expect(result).toBe('• Habit 1\n• Habit 2');
  });
});

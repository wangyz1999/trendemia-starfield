import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmbeddingScatterComponent } from './embedding-scatter.component';

describe('EmbeddingScatterComponent', () => {
  let component: EmbeddingScatterComponent;
  let fixture: ComponentFixture<EmbeddingScatterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmbeddingScatterComponent]
    });
    fixture = TestBed.createComponent(EmbeddingScatterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

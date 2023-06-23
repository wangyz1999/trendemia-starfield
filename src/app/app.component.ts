import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'trendemia';
  constructor(private metaService: Meta, private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Trendemia -> Starfield');
    this.metaService.updateTag({ name: 'author', content: 'Yunzhe Wang' });
    this.metaService.updateTag({ name: 'description', content: 'An AI-powered research analysis tool that performs comprehensive meta-analysis and sophisticated data visualization to predict, analyze, and illustrate trends in research and technological advancements.' });
    this.metaService.updateTag({ name: 'keywords', content: 'Data Visulization, Arxiv Paper, Research, Trend Analysis, Angular' });
  }
}

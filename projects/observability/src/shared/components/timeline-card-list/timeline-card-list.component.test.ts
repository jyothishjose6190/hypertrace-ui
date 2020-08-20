import { DateFormatMode, DateFormatter } from '@hypertrace/common';
import { createHostFactory, Spectator } from '@ngneat/spectator/jest';
import { TimelineCardListComponent } from './timeline-card-list.component';
import { TimelineCardListModule } from './timeline-card-list.module';

describe('Timeline Card List component', () => {
  let spectator: Spectator<TimelineCardListComponent>;

  const createHost = createHostFactory({
    declareComponent: false,
    component: TimelineCardListComponent,
    imports: [TimelineCardListModule],
    providers: []
  });

  test('should display all cards', () => {
    const data = [
      {
        name: 'First',
        timestamp: 1579817561559
      },
      {
        name: 'Second',
        timestamp: 1579813972292
      },
      {
        name: 'Third',
        timestamp: 1579810387143
      }
    ];

    spectator = createHost(
      `
    <ht-timeline-card-list>
      <ht-timeline-card-container *ngFor="let cardData of this.data" [timestamp]="cardData.timestamp">
        <div class="custom-card">
          <div class="title">{{cardData.name}}</div>
        </div>
      </ht-timeline-card-container>
    </ht-timeline-card-list>
    `,
      {
        hostProps: {
          data: data
        }
      }
    );

    expect(spectator.query('.selected-card')).not.toExist();

    spectator.setInput({
      selectedIndex: 0
    });

    // Add test logic
    const recordElements = spectator.queryAll('.record');

    expect(recordElements).toExist();
    expect(recordElements.length).toEqual(3);

    const selectedCard = spectator.query('.selected-card');
    expect(selectedCard).toBe(recordElements[0]);
    expect(selectedCard).not.toBe(recordElements[1]);
    expect(selectedCard).not.toBe(recordElements[2]);

    const dateFormatter = new DateFormatter({ mode: DateFormatMode.TimeWithSeconds });

    recordElements.forEach((recordElement, index) => {
      const timeElement = recordElement.querySelector('.value');
      expect(timeElement).toHaveText(dateFormatter.format(data[index].timestamp));

      const titleElement = recordElement.querySelector('.title');
      expect(titleElement).toExist();
      expect(titleElement).toHaveText(data[index].name);
    });
  });
});

import { fakeAsync, tick } from '@angular/core/testing';
import { TimeDuration, TimeDurationService, TimeRange, TimeUnit } from '@hypertrace/common';
import { createModelFactory, SpectatorModel } from '@hypertrace/dashboards/testing';
import {
  AttributeMetadataType,
  GraphQlQueryEventService,
  GraphQlTimeRange,
  MetricAggregationType,
  ObservedGraphQlRequest
} from '@hypertrace/distributed-tracing';
import { ModelApi } from '@hypertrace/hyperdash';
import {
  ExploreGraphQlQueryHandlerService,
  ExploreSpecification,
  EXPLORE_GQL_REQUEST,
  GraphQlExploreRequest,
  ObservabilityTraceType
} from '@hypertrace/observability';
import { runFakeRxjs } from '@hypertrace/test-utils';
import { mockProvider } from '@ngneat/spectator/jest';
import { GreetingMessageDataSourceModel } from './greeting-messag-data-source.model';

type GraphQlRequest = GraphQlExploreRequest;

describe('Greeting message data source model', () => {
  let spectator: SpectatorModel<GreetingMessageDataSourceModel>;
  const testTimeRange = { startTime: new Date(1568907645141), endTime: new Date(1568911245141) };
  let emittedRequests: GraphQlRequest[];
  const modelFactory = createModelFactory();

  const mockApi: Partial<ModelApi> = {
    getTimeRange: jest.fn(() => testTimeRange)
  };

  const exploreRequest = (timeRange: GraphQlTimeRange, selection: Partial<ExploreSpecification>) => ({
    requestType: EXPLORE_GQL_REQUEST,
    timeRange: timeRange,
    context: ObservabilityTraceType.Api,
    limit: 1,
    selections: [expect.objectContaining(selection)]
  });

  const buildSelection = (name: string, aggregation: MetricAggregationType) => ({
    name: name,
    aggregation: aggregation
  });

  beforeEach(() => {
    emittedRequests = [];

    spectator = modelFactory(GreetingMessageDataSourceModel, {
      providers: [
        mockProvider(TimeDurationService, {
          getTimeRangeDuration: (timeRange: Pick<TimeRange, 'startTime' | 'endTime'>) =>
            new TimeDuration(timeRange.endTime.getTime() - timeRange.startTime.getTime(), TimeUnit.Millisecond)
        }),
        mockProvider(GraphQlQueryEventService)
      ]
    });

    spectator.model.api = mockApi as ModelApi;
    spectator.model.query$.subscribe((query: ObservedGraphQlRequest<ExploreGraphQlQueryHandlerService>) => {
      const request = query.buildRequest([]);
      emittedRequests.push(request);
      query.responseObserver.next({
        results: [
          {
            'sum(errorCount)': {
              type: AttributeMetadataType.Number,
              value: 23
            }
          }
        ]
      });
      query.responseObserver.complete();
    });
  });

  test('builds expected requests and response', fakeAsync(() => {
    spectator.model.getData().subscribe(() => {
      // NOOP
    });

    tick();

    const current = new GraphQlTimeRange(testTimeRange.startTime, testTimeRange.endTime);
    const expectedRequests = [exploreRequest(current, buildSelection('errorCount', MetricAggregationType.Sum))];

    expect(emittedRequests).toEqual(expectedRequests);
  }));

  test('builds expected requests and response', fakeAsync(() => {
    runFakeRxjs(({ expectObservable }) => {
      expectObservable(spectator.model.getData()).toBe('(x|)', {
        x: {
          totalErrors: 23
        }
      });
    });
  }));
});
import { Box, Grid, Heading, List, ListItem, Skeleton } from '@chakra-ui/react';
import React, { useCallback, useState } from 'react';

import type { StatsChartsSection } from 'types/api/stats';
import type { StatsIntervalIds } from 'types/client/stats';

import { apos } from 'lib/html-entities';
import EmptySearchResult from 'ui/shared/EmptySearchResult';

import ChartsLoadingErrorAlert from './ChartsLoadingErrorAlert';
import ChartWidgetContainer from './ChartWidgetContainer';

type Props = {
  filterQuery: string;
  initialFilterQuery: string;
  isError: boolean;
  isPlaceholderData: boolean;
  charts?: Array<StatsChartsSection>;
  interval: StatsIntervalIds;
};

const ChartsWidgetsList = ({
  filterQuery,
  isError,
  isPlaceholderData,
  charts,
  interval,
  initialFilterQuery,
}: Props) => {
  const [ isSomeChartLoadingError, setIsSomeChartLoadingError ] = useState(false);
  const isAnyChartDisplayed = charts?.some(
    (section) => section.charts.length > 0,
  );
  const isEmptyChartList = Boolean(filterQuery) && !isAnyChartDisplayed;
  const sectionRef = React.useRef<HTMLUListElement | null>(null);

  const shouldScrollToSection = Boolean(initialFilterQuery);

  React.useEffect(() => {
    if (shouldScrollToSection) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ shouldScrollToSection ]);

  // const homeStatsQuery = useApiQuery('stats', {
  //   queryOptions: {
  //     refetchOnMount: false,
  //   },
  // });

  const handleChartLoadingError = useCallback(
    () => setIsSomeChartLoadingError(true),
    [ setIsSomeChartLoadingError ],
  );

  if (isError) {
    return <ChartsLoadingErrorAlert/>;
  }

  if (isEmptyChartList) {
    return (
      <EmptySearchResult
        text={ `Couldn${ apos }t find a chart that matches your filter query.` }
      />
    );
  }

  return (
    <Box>
      { isSomeChartLoadingError && <ChartsLoadingErrorAlert/> }

      <List ref={ sectionRef }>
        { charts?.map((section) => {
          if (section.id === 'contracts') {
            return null;
          } else {
            return (
              <ListItem
                key={ section.id }
                mb={ 8 }
                _last={{
                  marginBottom: 0,
                }}
              >
                <Skeleton
                  isLoaded={ !isPlaceholderData }
                  mb={ 4 }
                  display="inline-block"
                >
                  <Heading size="md">{ section.title }</Heading>
                </Skeleton>

                <Grid
                  templateColumns={{ lg: 'repeat(2, minmax(0, 1fr))' }}
                  gap={ 4 }
                >
                  { section.charts.map((chart) => (
                    <ChartWidgetContainer
                      key={ chart.id }
                      id={ chart.id }
                      title={ chart.title }
                      description={ chart.description }
                      interval={ interval }
                      units={ chart.units || undefined }
                      isPlaceholderData={ isPlaceholderData }
                      onLoadingError={ handleChartLoadingError }
                    />
                  )) }
                </Grid>
              </ListItem>
            );
          }
        }) }
      </List>
    </Box>
  );
};

export default ChartsWidgetsList;

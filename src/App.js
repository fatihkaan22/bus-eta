import { useEffect, useState } from 'react';
import axios from 'axios';
import { parse } from 'node-html-parser';
import './App.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import TimelineDot from '@mui/lab/TimelineDot';
import Typography from '@mui/material/Typography';
import { House, School, DirectionsBus } from '@mui/icons-material';

const getBusInfo = (stopName, bus, direction) => {
  return axios
    .get(
      `https://e-komobil.com/yolcu_bilgilendirme_operations.php?cmd=searchRouteStops&route_code=${bus}&direction=${direction}`
    )
    .then((res) => {
      console.log(`statusCode: ${res.status}`);
      const root = parse(res.data);
      const stops = root
        .querySelectorAll('li')
        .map((el, idx) => [el.innerText, idx]);
      const buses = stops.filter(([name, idx]) => name.startsWith('  '));
      const [, thisStopIdx] = stops.find(([name, idx]) =>
        name.includes(stopName)
      );
      const busDistances = buses.map(([stop, idx]) => thisStopIdx - idx);
      return busDistances;
    })
    .catch((error) => {
      console.error(error);
    });
};

const fmtMSS = (s) => (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s;

function App() {
  const STOP_NAME = 'GÜNERİ SOKAK';
  const BUS = '502';
  const DIRECTION = '1';

  const NO_ARRIVING = 4;
  const NO_PASSED = 2;
  const FETCH_INTERVAL = 2000;
  const ELAPSED_TIME_BETWEEN_STOPS = 25; // seconds

  const [busDistances, setBusDistances] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      getBusInfo(STOP_NAME, BUS, DIRECTION).then((distances) =>
        setBusDistances(distances)
      );
    }, FETCH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const theme = createTheme({
    palette: {
      mode: 'dark'
    }
  });

  const Home = (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineConnector />
        <TimelineDot color="primary">
          <House />
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <Typography variant="h6" component="span">
          Home
        </Typography>
        <Typography>Guneri Sokak</Typography>
      </TimelineContent>
    </TimelineItem>
  );

  const Campus = (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineConnector />
        <TimelineDot color="secondary">
          <School />
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <Typography variant="h6" component="span">
          GTU
        </Typography>
        <Typography>Campus</Typography>
      </TimelineContent>
    </TimelineItem>
  );

  const Bus = ({ distance, arriving, eta }) => (
    <TimelineItem>
      <TimelineOppositeContent
        sx={{ m: 'auto 0' }}
        variant="body2"
        color="text.secondary"
      >
        {arriving && `ETA: ${fmtMSS(eta)}`}
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineConnector />
        <TimelineDot color={arriving ? 'success' : 'error'}>
          <DirectionsBus />
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ py: '12px', px: 2 }}>
        <Typography variant="h6" component="span">
          {distance}
        </Typography>
        <Typography>Bus 502</Typography>
      </TimelineContent>
    </TimelineItem>
  );

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Timeline position="left">
          {busDistances
            ? busDistances
                .filter((d) => d > 0)
                .slice(-NO_ARRIVING)
                .map((d) => (
                  <Bus
                    distance={d}
                    eta={d * ELAPSED_TIME_BETWEEN_STOPS}
                    arriving
                  />
                ))
            : ''}
          {Home}
          {busDistances
            ? busDistances
                .filter((d) => d <= 0)
                .slice(0, NO_PASSED)
                .map((d) => <Bus distance={d} />)
            : ''}
          {Campus}
        </Timeline>
      </div>
    </ThemeProvider>
  );
}

export default App;

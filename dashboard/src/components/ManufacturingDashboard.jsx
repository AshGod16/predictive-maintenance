import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { AlertCircle, Activity, Gauge, Settings, Timer, RotateCw, AlertTriangle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';

const ManufacturingDashboard = () => {
  const [processData, setProcessData] = useState([]);
  const [stats, setStats] = useState({
    air: { high: 0, low: 0, min: 0, max: 0 },
    process: { high: 0, low: 0, min: 0, max: 0 },
    yDomain: [0, 0],
    predictiveMetrics: { failureProbability: 0, riskLevel: 'Low', timeToMaintenance: 0 }
  });
  
  // Calculate statistics for a data field
  const calculateStats = (data, field) => {
    if (!data.length) return { high: 0, low: 0, min: 0, max: 0 };
    const values = data.map(d => d[field]).filter(Boolean);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      high: mean + 2 * std,
      low: mean - 2 * std,
      min: min,
      max: max
    };
  };

  // Calculate predictive metrics
  const calculatePredictiveMetrics = (data, airStats, processStats) => {
    if (!data.length) return { failureProbability: 0, riskLevel: 'Low', timeToMaintenance: 0 };
    
    // Calculate recent failure probability (using last 100 points)
    const recentData = data.slice(-100);
    const recentFailures = recentData.filter(d => d.hasFailure).length;
    const failureProbability = (recentFailures / recentData.length) * 100;
    
    // Calculate risk level based on multiple parameters
    const lastPoint = data[data.length - 1];
    const riskScore = 
      (lastPoint.airTemp > airStats.high ? 2 : 0) +
      (lastPoint.processTemp > processStats.high ? 2 : 0) +
      (failureProbability > 5 ? 1 : 0);
    
    const riskLevel = riskScore <= 1 ? 'Low' : riskScore <= 3 ? 'Medium' : 'High';
    
    // Estimate time to maintenance (based on recent trends)
    const recentWearRate = recentData.reduce((acc, curr, idx) => {
      if (idx === 0) return acc;
      return acc + Math.abs(curr.airTemp - recentData[idx-1].airTemp);
    }, 0) / recentData.length;
    
    const timeToMaintenance = Math.max(0, Math.round(100 - (recentWearRate * 10)));
    
    return {
      failureProbability: failureProbability.toFixed(1),
      riskLevel,
      timeToMaintenance
    };
  };

  // Find regions where temperature exceeds thresholds
  const findExtremeRegions = (data, airStats, processStats) => {
    const regions = [];
    let start = null;
    
    data.forEach((point, index) => {
      const isExtreme = 
        point.airTemp > airStats.high ||
        point.airTemp < airStats.low ||
        point.processTemp > processStats.high ||
        point.processTemp < processStats.low;

      if (isExtreme && start === null) {
        start = index;
      } else if (!isExtreme && start !== null) {
        regions.push({ start, end: index - 1 });
        start = null;
      }
    });

    if (start !== null) {
      regions.push({ start, end: data.length - 1 });
    }

    return regions;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/predictive_maintenance.csv');
        const text = await response.text();
        console.log('CSV loaded:', text.slice(0, 200)); // Show first 200 characters
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            console.log('Parsed data:', results.data.slice(0, 5)); // Show first 5 rows
            const data = results.data.map((row, index) => ({
              index: index,
              airTemp: row['Air temperature [K]'],
              processTemp: row['Process temperature [K]'],
              hasFailure: row['Target'] > 0,
              wear: row['Tool wear [min]']
            }));

            // Calculate all stats
            const airStats = calculateStats(data, 'airTemp');
            const processStats = calculateStats(data, 'processTemp');
            
            // Calculate y-axis domain
            const yMin = Math.min(airStats.min, processStats.min);
            const yMax = Math.max(airStats.max, processStats.max);
            const yRange = yMax - yMin;
            const yPadding = yRange * 0.02;
            const yDomain = [yMin - yPadding, yMax + yPadding];

            // Calculate predictive metrics
            const predictiveMetrics = calculatePredictiveMetrics(data, airStats, processStats);

            setProcessData(data);
            setStats({
              air: airStats,
              process: processStats,
              yDomain,
              predictiveMetrics
            });
          }
        });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="w-full bg-gray-100 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manufacturing Dashboard</h1>
        <p className="text-gray-600">Real-time production monitoring and analytics</p>
      </div>

      {/* Predictive Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-8 border-blue-500 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">{stats.predictiveMetrics.failureProbability}%</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Failure Probability</h3>
              <p className="text-sm text-gray-600 mt-2">Based on recent patterns</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center">
              <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center mb-4 ${
                stats.predictiveMetrics.riskLevel === 'Low' ? 'border-green-500' :
                stats.predictiveMetrics.riskLevel === 'Medium' ? 'border-yellow-500' : 'border-red-500'
              }`}>
                <span className="text-xl font-bold">{stats.predictiveMetrics.riskLevel}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Risk Level</h3>
              <p className="text-sm text-gray-600 mt-2">Current operational risk</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-8 border-purple-500 flex items-center justify-center mb-4">
                <div className="text-center">
                  <span className="text-2xl font-bold">{stats.predictiveMetrics.timeToMaintenance}</span>
                  <span className="text-sm block">hours</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Time to Maintenance</h3>
              <p className="text-sm text-gray-600 mt-2">Estimated running time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uptime Rate</p>
                <h3 className="text-2xl font-bold">98.5%</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failure Rate</p>
                <h3 className="text-2xl font-bold">2.3%</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Equipment Health</p>
                <h3 className="text-2xl font-bold">68%</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <h3 className="text-2xl font-bold">94.8%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temperature Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Temperature Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={processData}
                margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {/* <XAxis 
                  dataKey="index" 
                  label={{ value: 'Time', position: 'bottom' }}
                  tick={{ fontSize: 12 }}
                /> */}
                <YAxis 
                  domain={stats.yDomain}
                  label={{ 
                    value: 'Temperature (K)', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -10
                  }}
                  tick={{ fontSize: 12 }}
                  tickCount={10}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip 
                  formatter={(value) => value.toFixed(2) + ' K'}
                  labelFormatter={(value) => `Time: ${value}`}
                />
                <Legend verticalAlign="top" height={36} />
                <Line 
                  type="monotone" 
                  dataKey="airTemp" 
                  stroke="#3b82f6" 
                  name="Air Temperature" 
                  dot={false}
                  strokeWidth={1}
                />
                <Line 
                  type="monotone" 
                  dataKey="processTemp" 
                  stroke="#6b7280" 
                  name="Process Temperature" 
                  dot={false}
                  strokeWidth={1}
                />
                {findExtremeRegions(processData, stats.air, stats.process).map((region, index) => (
                  <ReferenceArea
                    key={index}
                    x1={region.start}
                    x2={region.end}
                    fill="red"
                    fillOpacity={0.1}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Red regions indicate extreme temperature conditions (±2 standard deviations from mean)</p>
          </div>
        </CardContent>
      </Card>

      {/* Machine Wear and Tear */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Wear Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={processData}
                margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {/* <XAxis 
                  dataKey="index" 
                  label={{ value: 'Time', position: 'bottom' }}
                  tick={{ fontSize: 12 }}
                /> */}
                <YAxis 
                  domain={stats.yDomain}
                  label={{ 
                    value: 'Wear (hours)', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -10
                  }}
                  tick={{ fontSize: 12 }}
                  tickCount={10}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip 
                  formatter={(value) => value.toFixed(2) + ' hours'}
                  labelFormatter={(value) => `Time: ${value}`}
                />
                <Legend verticalAlign="top" height={36} />
                <Line 
                  type="monotone" 
                  dataKey="wear" 
                  stroke="#3b82f6" 
                  name="Wear" 
                  dot={false}
                  strokeWidth={1}
                />
                {findExtremeRegions(processData, stats.air, stats.process).map((region, index) => (
                  <ReferenceArea
                    key={index}
                    x1={region.start}
                    x2={region.end}
                    fill="red"
                    fillOpacity={0.1}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Red regions indicate extreme temperature conditions (±2 standard deviations from mean)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManufacturingDashboard;
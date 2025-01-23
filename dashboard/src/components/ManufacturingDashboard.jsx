import React, { useState, useEffect } from 'react';
import { Card, HalfCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { AlertCircle, Activity, Gauge, Settings, Timer, WrenchIcon, UsersIcon, RotateCw, AlertTriangle, CheckCircle, ClipboardList, TrendingUp, Bell } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Papa from 'papaparse';

const ActionCard = ({ icon: Icon, title, description, children, isRecommended, impact }) => {
    return (
      <div className="flex items-center w-full p-2 hover:bg-gray-50 border-b border-gray-200 last:border-b-0">
        <div className="flex-1 flex items-center gap-3">
          <Icon className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {impact && (
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-800 rounded-md">
              {impact}
            </span>
          )}
          {children}
        </div>
      </div>
    );
  };

const ManufacturingDashboard = () => {

    const handleSubmit = (formType) => {
        console.log(`Submitted ${formType} form`);
        // Here you would typically handle the form submission
      };

      const generateSimulatedWearData = () => {
        const data = [];
        const numPoints = 100;
        const baseWear = 150; // Starting wear value in minutes
        const wearRate = 0.7; // Average wear rate per time unit
        
        for (let i = 0; i < numPoints; i++) {
          // Add progressive wear with some variations
          const progressiveWear = baseWear + (i * wearRate);
          const randomVariation = (Math.random() - 0.5) * 2;
          
          // Add some periodic variations based on load
          const loadVariation = Math.sin(i / 15) * 1.5;
          
          // Occasional rapid wear events
          const wearSpike = i % 30 === 0 ? 3 : 0;
          
          const totalWear = progressiveWear + randomVariation + loadVariation + wearSpike;
          
          data.push({
            index: i,
            wear: totalWear,
            timestamp: new Date(Date.now() - (numPoints - i) * 60000).toLocaleTimeString(),
            wearStatus: totalWear > 200 ? 'Critical' : totalWear > 180 ? 'Warning' : 'Normal'
          });
        }
        return data;
      };

      const generateSimulatedData = () => {
        const data = [];
        const numPoints = 100;
        const baseAirTemp = 298; // Base temperature in Kelvin (about 25°C)
        const baseProcessTemp = 373; // Base temperature in Kelvin (about 100°C)
        
        for (let i = 0; i < numPoints; i++) {
          // Add some periodic variations and random noise
          const timeVariation = Math.sin(i / 10) * 2;
          const randomNoiseAir = (Math.random() - 0.5) * 3;
          const randomNoiseProcess = (Math.random() - 0.5) * 5;
          
          // Simulate some "events" that cause temperature spikes
          const eventSpike = i % 25 === 0 ? 5 : 0;
          
          data.push({
            index: i,
            airTemp: baseAirTemp + timeVariation + randomNoiseAir + eventSpike,
            processTemp: baseProcessTemp + timeVariation * 1.5 + randomNoiseProcess + eventSpike * 1.2,
            timestamp: new Date(Date.now() - (numPoints - i) * 60000).toLocaleTimeString() // Last 100 minutes
          });
        }
        return data;
      };
  const [wearData, setWearData] = useState([]);
  const [processData, setProcessData] = useState([]);
  const [stats, setStats] = useState({
    air: { high: 0, low: 0, min: 0, max: 0 },
    process: { high: 0, low: 0, min: 0, max: 0 },
    yDomain: [0, 0],
    predictiveMetrics: {
      failureProbability: 0,
      riskLevel: 'Low',
      timeToMaintenance: 0,
      qualityPrediction: 97.2,
      energyEfficiency: 83,
      stockOptimization: 4.2
    }
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
    if (!data.length) return { 
      failureProbability: 0, 
      riskLevel: 'Low', 
      timeToMaintenance: 0,
      qualityPrediction: 97.2,
      energyEfficiency: 83,
      stockOptimization: 4.2
    };
    
    const recentData = data.slice(-100);
    const recentFailures = recentData.filter(d => d.hasFailure).length;
    const failureProbability = (recentFailures / recentData.length) * 100;
    
    const lastPoint = data[data.length - 1];
    const riskScore = 
      (lastPoint.airTemp > airStats.high ? 2 : 0) +
      (lastPoint.processTemp > processStats.high ? 2 : 0) +
      (failureProbability > 5 ? 1 : 0);
    
    const riskLevel = riskScore <= 1 ? 'Low' : riskScore <= 3 ? 'Medium' : 'High';
    
    const recentWearRate = recentData.reduce((acc, curr, idx) => {
      if (idx === 0) return acc;
      return acc + Math.abs(curr.airTemp - recentData[idx-1].airTemp);
    }, 0) / recentData.length;
    
    const timeToMaintenance = Math.max(0, Math.round(100 - (recentWearRate * 70)));
    
    return {
      failureProbability: failureProbability.toFixed(1),
      riskLevel,
      timeToMaintenance,
      qualityPrediction: 97.2,
      energyEfficiency: 83,
      stockOptimization: 4.2
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
    // Initialize with simulated data
    const simulatedData = generateSimulatedData();
    const wearData = generateSimulatedWearData();
    
    // Calculate statistics
    const airStats = calculateStats(simulatedData, 'airTemp');
    const processStats = calculateStats(simulatedData, 'processTemp');
    const wearStats = calculateStats(wearData, 'wear');
    
    // Calculate y-axis domain
    const yMin = Math.min(airStats.min, processStats.min);
    const yMax = Math.max(airStats.max, processStats.max);
    const yRange = yMax - yMin;
    const yPadding = yRange * 0.02;
    const yDomain = [yMin - yPadding, yMax + yPadding];

    // Calculate predictive metrics
    const predictiveMetrics = calculatePredictiveMetrics(simulatedData, airStats, processStats);

    setProcessData(simulatedData);
    setWearData(wearData);
    setStats({
      air: airStats,
      process: processStats,
      wear: wearStats,
      yDomain,
      predictiveMetrics
    });

    // Update data every minute
    const interval = setInterval(() => {
        const newData = generateSimulatedData();
        setProcessData(newData);
        
        const newAirStats = calculateStats(newData, 'airTemp');
        const newProcessStats = calculateStats(newData, 'processTemp');
        const newYMin = Math.min(newAirStats.min, newProcessStats.min);
        const newYMax = Math.max(newAirStats.max, newProcessStats.max);
        const newYRange = newYMax - newYMin;
        const newYPadding = newYRange * 0.02;
        const newYDomain = [newYMin - newYPadding, newYMax + newYPadding];
        const newPredictiveMetrics = calculatePredictiveMetrics(newData, newAirStats, newProcessStats);
  
        setStats(prevStats => ({
          ...prevStats,
          air: newAirStats,
          process: newProcessStats,
          yDomain: newYDomain,
          predictiveMetrics: newPredictiveMetrics
        }));
      }, 60000); // Update every minute
  
      return () => clearInterval(interval);
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
        {/* First Row */}
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

        {/* Second Row */}
        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-8 border-orange-500 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold">{stats.predictiveMetrics.qualityPrediction}%</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Quality Prediction</h3>
                <p className="text-sm text-gray-600 mt-2">Next batch quality forecast</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-8 border-teal-500 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold">{stats.predictiveMetrics.energyEfficiency}%</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Energy Efficiency</h3>
                <p className="text-sm text-gray-600 mt-2">Predicted optimization potential</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-8 border-indigo-500 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold">{stats.predictiveMetrics.stockOptimization}</span>
                    <span className="text-sm block">days</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Stock Optimization</h3>
                <p className="text-sm text-gray-600 mt-2">Optimal reorder point</p>
              </div>
            </CardContent>
          </Card>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Quality Prediction Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Prediction Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { time: '12h ago', actual: 96.2, predicted: 96.0, lower: 95.5, upper: 96.5 },
                    { time: '9h ago', actual: 96.5, predicted: 96.3, lower: 95.8, upper: 96.8 },
                    { time: '6h ago', actual: 96.8, predicted: 96.7, lower: 96.2, upper: 97.2 },
                    { time: '3h ago', actual: 97.0, predicted: 96.9, lower: 96.4, upper: 97.4 },
                    { time: 'Now', actual: 97.2, predicted: 97.2, lower: 96.7, upper: 97.7 },
                    { time: '+3h', predicted: 97.4, lower: 96.9, upper: 97.9 },
                    { time: '+6h', predicted: 97.5, lower: 97.0, upper: 98.0 },
                    { time: '+9h', predicted: 97.3, lower: 96.8, upper: 97.8 },
                  ]}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[95, 98]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#3b82f6" name="Actual Quality" strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="#10b981" name="Predicted" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#10b981" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#10b981" fillOpacity={0.1} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Failure Probability Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Failure Risk Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { time: '12h ago', actual: 1.8, predicted: 1.7, lower: 1.2, upper: 2.2 },
                    { time: '9h ago', actual: 1.9, predicted: 1.8, lower: 1.3, upper: 2.3 },
                    { time: '6h ago', actual: 2.0, predicted: 1.9, lower: 1.4, upper: 2.4 },
                    { time: '3h ago', actual: 2.1, predicted: 2.0, lower: 1.5, upper: 2.5 },
                    { time: 'Now', actual: 2.3, predicted: 2.2, lower: 1.7, upper: 2.7 },
                    { time: '+3h', predicted: 2.5, lower: 2.0, upper: 3.0 },
                    { time: '+6h', predicted: 2.8, lower: 2.3, upper: 3.3 },
                    { time: '+9h', predicted: 3.2, lower: 2.7, upper: 3.7 },
                  ]}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 4]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#ef4444" name="Actual Risk" strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="#f97316" name="Predicted" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#f97316" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#f97316" fillOpacity={0.1} />
                  <ReferenceArea y1={3} y2={4} fill="#ef4444" fillOpacity={0.1} />
                  <ReferenceArea y1={2} y2={3} fill="#f97316" fillOpacity={0.1} />
                  <ReferenceArea y1={0} y2={2} fill="#22c55e" fillOpacity={0.1} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Energy Efficiency Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Efficiency Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { time: '12h ago', actual: 82.0, predicted: 81.8, lower: 81.3, upper: 82.3 },
                    { time: '9h ago', actual: 82.3, predicted: 82.1, lower: 81.6, upper: 82.6 },
                    { time: '6h ago', actual: 82.5, predicted: 82.4, lower: 81.9, upper: 82.9 },
                    { time: '3h ago', actual: 82.8, predicted: 82.7, lower: 82.2, upper: 83.2 },
                    { time: 'Now', actual: 83.0, predicted: 83.0, lower: 82.5, upper: 83.5 },
                    { time: '+3h', predicted: 83.4, lower: 82.9, upper: 83.9 },
                    { time: '+6h', predicted: 83.8, lower: 83.3, upper: 84.3 },
                    { time: '+9h', predicted: 84.2, lower: 83.7, upper: 84.7 },
                  ]}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[80, 85]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#6366f1" name="Actual Efficiency" strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" name="Predicted" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#8b5cf6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#8b5cf6" fillOpacity={0.1} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tool Wear Prediction */}
        <Card>
          <CardHeader>
            <CardTitle>Tool Wear Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { time: '12h ago', actual: 180, predicted: 178, lower: 175, upper: 181 },
                    { time: '9h ago', actual: 185, predicted: 183, lower: 180, upper: 186 },
                    { time: '6h ago', actual: 190, predicted: 188, lower: 185, upper: 191 },
                    { time: '3h ago', actual: 195, predicted: 193, lower: 190, upper: 196 },
                    { time: 'Now', actual: 200, predicted: 198, lower: 195, upper: 201 },
                    { time: '+3h', predicted: 205, lower: 202, upper: 208 },
                    { time: '+6h', predicted: 210, lower: 207, upper: 213 },
                    { time: '+9h', predicted: 215, lower: 212, upper: 218 },
                  ]}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[170, 220]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#0ea5e9" name="Actual Wear" strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="#06b6d4" name="Predicted" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#06b6d4" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#06b6d4" fillOpacity={0.1} />
                  <ReferenceArea y1={210} y2={220} fill="#ef4444" fillOpacity={0.1} />
                </LineChart>
              </ResponsiveContainer>
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
                data={wearData}
                margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                //   dataKey="index" 
                  label={{ value: 'Time', position: 'bottom' }}
                //   tick={{ fontSize: 12 }}
                />
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

      <HalfCard className="mb-6">
        <CardHeader>
          <CardTitle>Action Center - Take Quick Actions Here</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
            {/* First Row */}
            <div className="col-span-full grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
            <ActionCard
              icon={ClipboardList}
              title="Production Adjustment"
              description="Modify production parameters"
              isRecommended={stats.predictiveMetrics.energyEfficiency < 85 || processData.some(d => d.airTemp > stats.air.high || d.processTemp > stats.process.high)}
              impact={`+${(100 - stats.predictiveMetrics.energyEfficiency).toFixed(1)}% efficiency`}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">Adjust</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Adjust Production Parameters</AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Production line" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="line1">Production Line 1</SelectItem>
                            <SelectItem value="line2">Production Line 2</SelectItem>
                            <SelectItem value="line3">Production Line 3</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="number" placeholder="Target speed (rpm)" />
                        <Input type="number" placeholder="Temperature threshold (K)" />
                        <Textarea placeholder="Adjustment reason" />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSubmit('production')}>Apply Changes</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </ActionCard>

            <ActionCard
              icon={TrendingUp}
              title="Quality Inspection"
              description="Schedule quality check"
              isRecommended={stats.predictiveMetrics.qualityPrediction < 98}
              impact={`+${(100 - stats.predictiveMetrics.qualityPrediction).toFixed(1)}% quality`}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">Schedule</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Schedule Quality Inspection</AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Inspection type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="routine">Routine Inspection</SelectItem>
                            <SelectItem value="detailed">Detailed Analysis</SelectItem>
                            <SelectItem value="emergency">Emergency Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="datetime-local" placeholder="Inspection date and time" />
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Inspector" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="team1">Team 1</SelectItem>
                            <SelectItem value="team2">Team 2</SelectItem>
                            <SelectItem value="team3">Team 3</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea placeholder="Special instructions" />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSubmit('quality')}>Schedule Inspection</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </ActionCard>

            <ActionCard
                icon={AlertCircle}
                title="Alert Configuration"
                description="Customize system alerts"
                isRecommended={true}
                impact="+15min response time"
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2">Configure</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Configure System Alerts</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-4">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Alert category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="temperature">Temperature Alerts</SelectItem>
                              <SelectItem value="maintenance">Maintenance Alerts</SelectItem>
                              <SelectItem value="quality">Quality Alerts</SelectItem>
                              <SelectItem value="performance">Performance Alerts</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="number" placeholder="Temperature threshold (K)" />
                          <Input type="number" placeholder="Alert delay (minutes)" />
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Notification method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input type="text" placeholder="Recipients (comma-separated)" />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleSubmit('alert-config')}>Save Configuration</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </ActionCard>           

            <ActionCard
              icon={WrenchIcon}
              title="Request maintenance for equipment"
              isRecommended={(stats.predictiveMetrics.timeToMaintenance < 24 || stats.predictiveMetrics.failureProbability > 5) && stats.predictiveMetrics.failureProbability * 1.5 > 0}
              impact={`-${(stats.predictiveMetrics.failureProbability * 1.5).toFixed(1)}% failure risk`}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">Schedule</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Schedule Maintenance Request</AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select equipment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="machine1">Machine 1</SelectItem>
                            <SelectItem value="machine2">Machine 2</SelectItem>
                            <SelectItem value="machine3">Machine 3</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="datetime-local" placeholder="Select date and time" />
                        <Textarea placeholder="Maintenance description" />
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Priority level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleSubmit('maintenance')}>Submit</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </ActionCard>
              <ActionCard
                icon={WrenchIcon}
                title="Schedule Engineer Meeting"
                description="Discuss system performance"
                isRecommended={stats.predictiveMetrics.riskLevel !== 'Low'}
                impact={stats.predictiveMetrics.riskLevel === 'High' ? '-40% risk exposure' : 
                    stats.predictiveMetrics.riskLevel === 'Medium' ? '-25% risk exposure' : 
                    '-0% risk exposure'}
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2">Schedule</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Schedule Engineer Meeting</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-4">
                          <Input type="datetime-local" placeholder="Meeting date and time" />
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Meeting type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="performance">Performance Review</SelectItem>
                              <SelectItem value="maintenance">Maintenance Planning</SelectItem>
                              <SelectItem value="optimization">Process Optimization</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Required attendees" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="maintenance">Maintenance Team</SelectItem>
                              <SelectItem value="production">Production Team</SelectItem>
                              <SelectItem value="quality">Quality Team</SelectItem>
                              <SelectItem value="all">All Teams</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea placeholder="Meeting agenda and notes" />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleSubmit('engineer-meeting')}>Schedule Meeting</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </ActionCard>

              <ActionCard
                icon={UsersIcon}
                title="Report Issue"
                description="Submit equipment problems"
                isRecommended={stats.predictiveMetrics.failureProbability > 10}
                impact={`-${Math.min(60, stats.predictiveMetrics.failureProbability * 2).toFixed(1)}% downtime`}
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2">Report</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Report Equipment Issue</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-4">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Equipment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="machine1">Machine 1</SelectItem>
                              <SelectItem value="machine2">Machine 2</SelectItem>
                              <SelectItem value="machine3">Machine 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Issue type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mechanical">Mechanical</SelectItem>
                              <SelectItem value="electrical">Electrical</SelectItem>
                              <SelectItem value="software">Software</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="critical">Critical</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea placeholder="Detailed description of the issue" />
                          <Input type="text" placeholder="Contact person" />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleSubmit('issue-report')}>Submit Report</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </ActionCard>
            </div>
          </div>
        </CardContent>
      </HalfCard>
    </div>
  );
};

export default ManufacturingDashboard;
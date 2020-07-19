import React, {useEffect, useState} from 'react';
import moment from 'moment';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Amplify, { PubSub, Auth } from 'aws-amplify'
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import {LineChart} from "react-native-chart-kit";

//Set the authentication credentials
Auth.configure({
  region: 'eu-central-1',
  identityPoolId: "eu-central-1:4dd19f33-55d6-444a-9489-5bf2b636506f",
});

//Authenticate without user login
var anonymousCredentials =  Auth.currentCredentials();

//Configure your IoT-Core
Amplify.addPluggable(new AWSIoTProvider({
  aws_pubsub_region: 'eu-central-1', //adapt to your region
  aws_pubsub_endpoint: 'wss://*******************.iot.eu-central-1.amazonaws.com/mqtt', //adapt to your endpoint
}));

//Holds the data from the IoT-Core
let IoTdata = new Map([
  [moment().format('YY-MM-DD hh:mm:ss'),0]
]);
let subscription;

function App() {
  const [chData, setChData] = useState(new Map([
    [moment().format('YY-MM-DD hh:mm:ss'), 0]
  ]));
  const [counter, setcounter] = useState(0);
  useEffect(() => {
    connect();
  }, []);
  useEffect(() =>{
    setChData(IoTdata)
  }, [counter]);


//Connect to the AWS IoT-Core
  function connect() {
    subscription = PubSub.subscribe('sensor/temperature').subscribe({
      next: data => {
        console.log(data.value);
        IoTdata = setData(IoTdata, data);
        setcounter(counter => counter + 1)},

      error: error => console.log(error.message),
      close: () => console.log('Done'),
    });
  }
//Set chart data
  function setData(oldData,newData) {
    let existingData = chData;
    existingData.set(moment().format('YY-MM-DD hh:mm:ss'), newData.value);
    if(existingData.size>15){
      existingData.delete(existingData.keys().next().value);
    }
    console.log(existingData);
    return existingData
  }

  //Format the x axis date
  function formatHandlerXAxis (value) {
    return moment(value, 'YY-MM-DD hh:mm:ss').format('hh:mm:ss');
  }

  return (
      <View style={styles.container}>
        <View style ={styles.container}>
          <Text style = {styles.heading}>Temperature Chart</Text>
          <LineChart
              data={{
                labels: Array.from(chData.keys()),
                datasets: [{
                    data: Array.from(chData.values()),}]
              }}
              width={Dimensions.get("window").width-10}
              height={400}
              chartConfig={{
                backgroundColor: "#e26a00",
                backgroundGradientFrom: "#fb8c00",
                backgroundGradientTo: "#ffa726",
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 30
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#ffa726"
                }
              }}
              bezier
              verticalLabelRotation = {45}
              formatXLabel={ value => formatHandlerXAxis(value) }

              style={{
                marginVertical: 12,
                borderRadius: 6
              }}
          />
        </View>
        </View>
  );
}

export default (App);


const styles = StyleSheet.create({
  heading: {
    fontVariant: ['small-caps'],
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    fontStyle: 'italic',
    margin: 20,
    fontSize: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

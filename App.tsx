import * as React from "react";
import { StatusBar } from "expo-status-bar";
import { Alert, Button, StyleSheet, Text, View } from "react-native";

import { InferenceSession, Tensor } from "onnxruntime-react-native";
import { Asset } from "expo-asset";
import Recording from "./src/Recording";


// Note: These modules are used for reading model into bytes
// import RNFS from 'react-native-fs';
// import base64 from 'base64-js';

let Session: InferenceSession;

export default function App() {
  async function loadModel() {
    try {
      // Note: `.onnx` model files can be viewed in Netron (https://github.com/lutzroeder/netron) to see
      // model inputs/outputs detail and data types, shapes of those, etc.

      // loading model from bytes
      // const base64Str = await RNFS.readFile(modelUri, 'base64');
      // const uint8Array = base64.toByteArray(base64Str);
      // myModel = await InferenceSession.create(uint8Array);

      const modelPath = require("./assets/whisper_cpu_int8_model.onnx");
      const assets = await Asset.loadAsync(modelPath);
      const modelUri = assets[0].localUri;

      // const localUri =
      //   "file:///data/user/0/ai.onnxruntime.example.reactnative.basicusage/cache/ExponentAsset-1396d8318edd65074cb78db2751ce473.onnx";
      // const modelUri = localUri;

      if (!modelUri) {
        Alert.alert("failed to get model URI", `${assets[0]}`);
      } else {
        // load model from model url path
        Session = await InferenceSession.create(modelUri, {
          // executionProviders: ["cpu", "nnapi"],
        });
        console.log("model loaded successfully");
      }
    } catch (e) {
      Alert.alert("failed to load model", `${e}`);
      throw e;
    }
  }

  function unsignedByteToSigned(unsignedByte) {
    return unsignedByte > 127 ? unsignedByte - 256 : unsignedByte;
  }

  async function runModel(audioBuffer: number[], beams = 1) {
    let floatArray: number[] = [];
    for (let i = 0; i < audioBuffer.length; i++) {
      floatArray[i] = unsignedByteToSigned(audioBuffer[i]) / 32768.0;
      floatArray[i] = Math.max(floatArray[i], -1);
      floatArray[i] = Math.min(floatArray[i], 1);
    }
    try {
      const min_length = Int32Array.from({ length: 1 }, () => 1);
      const max_length = Int32Array.from({ length: 1 }, () => 448);
      const num_return_sequences = Int32Array.from({ length: 1 }, () => 1);
      const length_penalty = Float32Array.from({ length: 1 }, () => 1);
      const repetition_penalty = Float32Array.from({ length: 1 }, () => 1);

      const feed = {
        audio_pcm: new Tensor(new Float32Array(floatArray), [
          1,
          audioBuffer.length,
        ]),

        max_length: new Tensor(new Int32Array(max_length), [1]),
        min_length: new Tensor(new Int32Array(min_length), [1]),
        num_beams: new Tensor(
          Int32Array.from({ length: 1 }, () => beams),
          [1]
        ),
        num_return_sequences: new Tensor(new Int32Array(num_return_sequences), [
          1,
        ]),
        length_penalty: new Tensor(new Float32Array(length_penalty), [1]),
        repetition_penalty: new Tensor(new Float32Array(repetition_penalty), [
          1,
        ]),
      };

      const fetches = await Session.run(feed);
      const output = fetches[Session.outputNames[0]];

      if (!output) {
        Alert.alert("failed to get output", `${Session.outputNames[0]}`);
      } else {
        Alert.alert(
          "model inference successfully",
          `output shape: ${output.dims}, output data: ${output.data}`
        );
      }
    } catch (e) {
      console.error("failed to run model", `${e}`);
    }
  }

  const handleAudioData = (audioBuffer: number[]) => {
    runModel(audioBuffer);
  };

  return (
    <View style={styles.container}>
      <Button title="Load model" onPress={loadModel}></Button>
      <Text>{"\n"}</Text>
      <Recording handleAudioData={handleAudioData} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

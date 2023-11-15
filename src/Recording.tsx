import * as React from "react";
import { Text, View, StyleSheet, Button } from "react-native";
import AudioRecord from "react-native-audio-record";
import { Buffer } from "buffer";

export default function App({ handleAudioData }) {
  const [recording, setRecording] = React.useState<Boolean>();
  const [audioBuffer, setAudioBuffer] = React.useState<number[]>();
  const [cleared, setCleared] = React.useState<Boolean>(false);

  async function startRecording() {
    setRecording(true);
    console.log("recording started");

    try {
      AudioRecord.start();
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  }

  async function clear() {
    setCleared(true);
  }

  async function stopRecording() {
    try {
      setRecording(false);
      const audioFile = await AudioRecord.stop();
      handleAudioData(audioBuffer);
      // setAudioBuffer([]);
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  }

  React.useEffect(() => {
    const options = {
      sampleRate: 16000, // default 44100
      channels: 1, // 1 or 2, default 1
      bitsPerSample: 16, // 8 or 16, default 16
      audioSource: 6, // android only (see below)
      wavFile: "test.wav", // default 'audio.wav'
    };
    AudioRecord.init(options);
  }, []);

  React.useEffect(() => {
    AudioRecord.on("data", (data) => {
      const byteArray = Buffer.from(data, "base64");
      setAudioBuffer((prevState) => {
        if (prevState) {
          return [...prevState, ...byteArray];
        } else {
          return byteArray;
        }
      });
    });
  }, [
    recording,
  ]);

  return (
    <>
      <Button
        title={recording ? "Stop Recording" : "Start Recording"}
        onPress={recording ? stopRecording : startRecording}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    padding: 10,
  },
});

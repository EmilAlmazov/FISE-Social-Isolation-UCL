import { drawKeyPoints, drawSkeleton } from "../utils";
import React, { Component } from "react";
import * as posenet from "@tensorflow-models/posenet";
import "./PoseNet.css";

class PoseNet extends Component {
  static defaultProps = {
    videoWidth: 900,
    videoHeight: 700,
    flipHorizontal: false,
    algorithm: "single-pose",
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
    minPoseConfidence: 0.1,
    minPartConfidence: 0.4,
    maxPoseDetections: 1,
    nmsRadius: 20,
    outputStride: 32,
    imageScaleFactor: 0.5,
    skeletonColor: "#41B4A1",
    skeletonLineWidth: 6,
  };

  constructor(props) {
    super(props, PoseNet.defaultProps);
  }

  getCanvas = (elem) => {
    this.canvas = elem;
  };

  getVideo = (elem) => {
    this.video = elem;
  };

  async componentDidMount() {
    try {
      await this.setupCamera();
    } catch (error) {
      throw new Error(
        "This browser does not support video capture, or this device does not have a camera"
      );
    }

    try {
      this.posenet = await posenet.load({
        architecture: "ResNet50",
        outputStride: 32,
        inputResolution: { width: 257, height: 200 },
        quantBytes: 2,
      });
    } catch (error) {
      console.log(error);
      throw new Error("PoseNet failed to load");
    } finally {
      setTimeout(() => {
        this.setState({ loading: false });
      }, 200);
    }

    this.detectPose();
  }

  async setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }
    const { videoWidth, videoHeight } = this.props;
    const video = this.video;
    video.width = videoWidth;
    video.height = videoHeight;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: videoWidth,
        height: videoHeight,
      },
    });

    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve(video);
      };
    });
  }

  detectPose() {
    const { videoWidth, videoHeight } = this.props;
    const canvas = this.canvas;
    const canvasContext = canvas.getContext("2d");

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    this.poseDetectionFrame(canvasContext);
  }

  poseDetectionFrame(canvasContext) {
    const {
      imageScaleFactor,
      flipHorizontal,
      outputStride,
      minPoseConfidence,
      minPartConfidence,
      videoWidth,
      videoHeight,
      showVideo,
      showPoints,
      showSkeleton,
      skeletonColor,
      skeletonLineWidth,
    } = this.props;

    const posenetModel = this.posenet;
    const video = this.video;

    const findPoseDetectionFrame = async () => {
      let poses = [];

      const pose = await posenetModel.estimateSinglePose(
        video,
        imageScaleFactor,
        flipHorizontal,
        outputStride
      );
      poses.push(pose);

      canvasContext.clearRect(0, 0, videoWidth, videoHeight);

      if (showVideo) {
        canvasContext.save();
        canvasContext.scale(1, 1);
        // canvasContext.scale(-1, 1);
        // canvasContext.translate(-videoWidth, 0)
        canvasContext.drawImage(video, 0, 0, videoWidth, videoHeight);
        canvasContext.restore();
      }

      poses.forEach(({ score, keypoints }) => {
        if (score >= minPoseConfidence) {
          if (showPoints) {
            drawKeyPoints(
              keypoints,
              minPartConfidence,
              skeletonColor,
              canvasContext
            );
          }
          if (showSkeleton) {
            drawSkeleton(
              keypoints,
              minPartConfidence,
              skeletonColor,
              skeletonLineWidth,
              canvasContext
            );
          }
          console.log("HO");
        }
      });
      if (this.props.onEstimate) this.props.onEstimate(poses);
      requestAnimationFrame(findPoseDetectionFrame);
    };
    findPoseDetectionFrame();
  }

  render() {
    return (
      <div>
        <div>
          <video
            style={{ display: "none" }}
            playsInline
            ref={this.getVideo}
          />
          <div
            aria-label="Loading"
            className="webcam"
            style={{
              width: this.props.videoWidth,
              height: this.props.videoHeight,
              backgroundColor: "#41B4A1",
              ...(this.posenet && { display: "none" }),
            }}
          >Loading model... (May take up to a minute)</div>
          <canvas
            className="webcam mirror"
            style={this.posenet || { display: "none" }}
            ref={this.getCanvas}
          />
        </div>
      </div>
    );
  }
}

export default PoseNet;

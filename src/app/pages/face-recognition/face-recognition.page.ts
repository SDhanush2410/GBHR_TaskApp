import {
  Component,
  OnInit,
  NgZone,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import * as tf from '@tensorflow/tfjs';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/lazy';
import * as faceapi from '@vladmandic/face-api';

@Component({
  selector: 'app-face-recognition',
  templateUrl: './face-recognition.page.html',
  styleUrls: ['./face-recognition.page.scss'],
  standalone: false
})
export class FaceRecognitionPage implements OnInit {

  @ViewChild('liveVideo')
  liveVideo!: ElementRef<HTMLVideoElement>;

  user: any = {};

  modelsLoaded = false;
  isLoadingModels = false;
  isScanning = false;

  // Profile status:
  // Verified | Not Verified | Verification Failed
  resultStatus = '';

  errorMessage = '';
  scanInstruction = 'Preparing face verification...';

  private cameraStream: MediaStream | null = null;
  private modelLoadPromise: Promise<void> | null = null;

  // Grabs still frames directly from the camera track, bypassing the
  // <video>/<canvas> rendering pipeline that can return stale/blank
  // frames on some Android WebViews even while the on-screen preview
  // looks correct. Typed loosely since ImageCapture isn't in all
  // TS DOM lib versions yet.
  private imageCapture: any = null;

  // More conservative starting threshold than 0.6.
  // Calibrate using genuine and non-matching employee images.
  private readonly MATCH_THRESHOLD = 0.45;

  private readonly MODEL_URL =
    new URL('assets/models/', document.baseURI).toString();

  private readonly REFERENCE_IMAGE_URL =
    new URL(
      'assets/face-reference/employee1.jpeg',
      document.baseURI
    ).toString();

  // Key used to share the latest verification result with the
  // Profile page (see ProfilePage.faceVerificationStatus).
  private readonly FACE_STATUS_STORAGE_KEY = 'faceVerificationStatus';

  // ---------------------------------------
  // SAVE RESULT SO PROFILE PAGE CAN READ IT
  // ---------------------------------------

  private saveVerificationStatus(status: string): void {

    try {

      localStorage.setItem(
        this.FACE_STATUS_STORAGE_KEY,
        JSON.stringify({
          status,
          verifiedAt: new Date().toISOString()
        })
      );

    } catch (error) {
      console.error('Unable to save verification status:', error);
    }
  }

  constructor(
    private router: Router,
    private alertController: AlertController,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  // ---------------------------------------
  // FORCE ANGULAR UI REFRESH
  // ---------------------------------------

  private updateUI(callback?: () => void): void {

    this.ngZone.run(() => {

      if (callback) {
        callback();
      }

      this.cdr.detectChanges();

    });

  }

  ngOnInit(): void {
    this.loadEmployeeDetails();
  }

  ionViewWillEnter(): void {
    this.loadEmployeeDetails();
  }

  ionViewWillLeave(): void {
    this.stopLiveCamera();
  }

  // ---------------------------------------
  // EMPLOYEE DETAILS
  // ---------------------------------------

  loadEmployeeDetails(): void {

    const storedUser = localStorage.getItem('userDetails');

    if (!storedUser) {
      this.router.navigate(['/login'], {
        replaceUrl: true
      });
      return;
    }

    try {
      this.user = JSON.parse(storedUser);
    } catch (error) {
      console.error('Unable to load employee details:', error);

      this.router.navigate(['/login'], {
        replaceUrl: true
      });
    }
  }

  get employeeName(): string {
    return [
      this.user?.FirstName || '',
      this.user?.LastName || ''
    ].filter(Boolean).join(' ') || 'Employee';
  }

  get employeeId(): string {
    return String(this.user?.EmployeeID || 'Not provided');
  }

  // ---------------------------------------
  // LOAD FACE API MODELS
  // ---------------------------------------


async loadModels(): Promise<void> {

  if (this.modelsLoaded) {
    return;
  }

  if (this.modelLoadPromise) {
    return this.modelLoadPromise;
  }

  this.updateUI(() => {
    this.isLoadingModels = true;
  });

  this.modelLoadPromise = (async () => {

    try {

      console.log('Loading Face Recognition models...');

      // STEP 1: Initialize TensorFlow CPU backend.
      console.log('Setting TensorFlow CPU backend...');

      await tf.setBackend('cpu');
      await tf.ready();

      console.log(
        'TensorFlow backend:',
        tf.getBackend()
      );

      // STEP 2: Load Tiny Face Detector.
      await faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL);
      console.log('Tiny Face Detector loaded');

      // STEP 3: Load Face Landmark model.
      await faceapi.nets.faceLandmark68Net.loadFromUri(
        this.MODEL_URL
      );

      console.log('Face Landmark model loaded');

      // STEP 4: Load Face Recognition model.
      await faceapi.nets.faceRecognitionNet.loadFromUri(
        this.MODEL_URL
      );

      console.log('Face Recognition model loaded');

      this.updateUI(() => {
        this.modelsLoaded = true;
      });

    } catch (error) {

      console.error('Model loading failed:', error);

      this.updateUI(() => {
        this.modelsLoaded = false;
      });

      throw new Error(
        'Unable to initialize AI models. Check TensorFlow backend and model files.'
      );

    }

  })();

  try {

    await this.modelLoadPromise;

  } finally {

    this.updateUI(() => {
      this.isLoadingModels = false;
    });

    this.modelLoadPromise = null;

  }
}


  // ---------------------------------------
  // OPEN LIVE FRONT CAMERA
  // ---------------------------------------

  private async startLiveCamera(): Promise<HTMLVideoElement> {

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(
        'Live camera is unavailable. Check Android camera permissions and WebView support.'
      );
    }

    try {

      this.cameraStream =
        await navigator.mediaDevices.getUserMedia({

          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },

          audio: false

        });

    } catch (error: any) {

      // Surface a clear, actionable message instead of the raw
      // "Permission denied" DOMException, since on Android this is
      // almost always a missing/declined CAMERA permission rather
      // than something the user can fix by just retrying.
      if (
        error?.name === 'NotAllowedError' ||
        error?.name === 'PermissionDeniedError'
      ) {
        throw new Error(
          'Camera permission was denied. Please allow camera access for this app (Settings > Apps > TaskApp > Permissions > Camera) and try again.'
        );
      }

      if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
        throw new Error(
          'No front camera could be found on this device.'
        );
      }

      if (error?.name === 'NotReadableError') {
        throw new Error(
          'The camera is already in use by another app. Close it and try again.'
        );
      }

      throw new Error(
        error?.message || 'Unable to access the camera. Please try again.'
      );

    }

    // Ensure Angular has rendered the video element.
    this.updateUI();

    await new Promise(resolve => setTimeout(resolve, 150));

    const video = this.liveVideo?.nativeElement;

    if (!video) {
      throw new Error('Live camera preview could not be initialized.');
    }

    video.srcObject = this.cameraStream;

    await video.play();

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error('Camera video is not ready. Please try again.');
    }

    console.log(
      'Live camera started:',
      video.videoWidth,
      'x',
      video.videoHeight
    );

    return video;
  }

  // ---------------------------------------
  // STOP LIVE CAMERA
  // ---------------------------------------

  private stopLiveCamera(): void {

    if (this.cameraStream) {

      this.cameraStream.getTracks().forEach(track => {
        track.stop();
      });

      this.cameraStream = null;

    }

    if (this.liveVideo?.nativeElement) {
      this.liveVideo.nativeElement.srcObject = null;
    }
  }

  // ---------------------------------------
  // DELAY BETWEEN LIVE CAMERA FRAMES
  // ---------------------------------------

  private wait(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }

  // ---------------------------------------
  // LIVE HEAD MOVEMENT DETECTION
  // ---------------------------------------

private async verifyHeadMovement(
  video: HTMLVideoElement
): Promise<void> {

  console.log('Starting live head movement verification');

  const timeoutAt = Date.now() + 90000;

  const baselineSamples: number[] = [];

  let baseline = 0;
  let baselineReady = false;

  let firstDirection = 0;
  let candidateDirection = 0;

  let firstMovementCount = 0;
  let oppositeMovementCount = 0;

  let consecutiveMisses = 0;
  let frameCounter = 0;

  const MOVEMENT_THRESHOLD = 0.045;
  const REQUIRED_FRAMES = 3;
  const DETECTION_MIN_CONFIDENCE = 0.15;
  

  // Reduce frame dimensions to improve CPU detection speed.
  const originalWidth = video.videoWidth || 480;
  const originalHeight = video.videoHeight || 640;

  const scale = Math.min(1, 224 / originalWidth);

  const snapshotCanvas = document.createElement('canvas');

  snapshotCanvas.width = Math.round(originalWidth * scale);
  snapshotCanvas.height = Math.round(originalHeight * scale);

  const snapshotContext = snapshotCanvas.getContext('2d', {
    willReadFrequently: true
  });

  if (!snapshotContext) {
    throw new Error('Unable to process live camera frames.');
  }

  console.log(
    'Live detection frame size:',
    snapshotCanvas.width,
    'x',
    snapshotCanvas.height
  );

  this.updateUI(() => {
    this.scanInstruction =
      'Look straight at the camera and keep your face centered.';
  });

  while (Date.now() < timeoutAt) {

    if (!this.cameraStream?.active) {
      throw new Error('Camera stopped during face verification.');
    }

    if (video.readyState < video.HAVE_CURRENT_DATA) {
      await this.wait(150);
      continue;
    }

    // Capture a smaller frame from the live camera.
    snapshotContext.drawImage(
      video,
      0,
      0,
      snapshotCanvas.width,
      snapshotCanvas.height
    );

    frameCounter++;

    const detectionStart = Date.now();

    if (frameCounter % 5 === 0) {
      console.log(
        'Processing live frame:',
        frameCounter
      );
    }

    // Run face detection.
    const detections = await faceapi
      .detectAllFaces(
        snapshotCanvas,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 160,
          scoreThreshold: 0.3
        })
      )
      .withFaceLandmarks();

    const detectionTime = Date.now() - detectionStart;

    console.log(
      'Frame:',
      frameCounter,
      '| Faces:',
      detections.length,
      '| Detection time:',
      detectionTime,
      'ms'
    );

    // No face detected.
    if (detections.length === 0) {

      consecutiveMisses++;

      if (consecutiveMisses === 5) {
        this.updateUI(() => {
          this.scanInstruction =
            'Face not detected. Move closer and ensure good lighting.';
        });
      }

      await this.wait(100);
      continue;
    }

    consecutiveMisses = 0;

    // More than one face detected.
    if (detections.length > 1) {
      throw new Error(
        'Multiple faces detected. Ensure only one person is visible.'
      );
    }

    const detection = detections[0];

    const box = detection.detection.box;
    const noseTip = detection.landmarks.positions[30];

    if (!box.width || !noseTip) {
      await this.wait(100);
      continue;
    }

    // Normalize nose position against the face bounding box.
    const nosePosition =
      (noseTip.x - (box.x + box.width / 2)) / box.width;

    // STEP 1: Collect neutral face position.
    if (baselineSamples.length < 8) {

      baselineSamples.push(nosePosition);

      this.updateUI(() => {
        this.scanInstruction =
          'Keep looking straight at the camera...';
      });

      await this.wait(100);
      continue;
    }

    // STEP 2: Calculate baseline once.
    if (!baselineReady) {

      baseline =
        baselineSamples.reduce(
          (total, value) => total + value,
          0
        ) / baselineSamples.length;

      baselineReady = true;

      console.log('Neutral face position:', baseline);

      this.updateUI(() => {
        this.scanInstruction =
          'Turn your head slightly to either side.';
      });

      await this.wait(100);
      continue;
    }

    const movement = nosePosition - baseline;

    console.log(
      'Current movement:',
      movement.toFixed(4)
    );

    // STEP 3: Detect first direction.
    if (firstDirection === 0) {

      if (Math.abs(movement) > MOVEMENT_THRESHOLD) {

        const direction = movement > 0 ? 1 : -1;

        if (candidateDirection === direction) {
          firstMovementCount++;
        } else {
          candidateDirection = direction;
          firstMovementCount = 1;
        }

        if (firstMovementCount >= REQUIRED_FRAMES) {

          firstDirection = candidateDirection;

          candidateDirection = 0;
          firstMovementCount = 0;

          console.log('First head movement detected');

          this.updateUI(() => {
            this.scanInstruction =
              'Good! Now turn your head to the opposite side.';
          });
        }

      } else {

        candidateDirection = 0;
        firstMovementCount = 0;

      }

    } else {

      // STEP 4: Detect opposite direction.
      const oppositeMovement =
        movement * firstDirection < -MOVEMENT_THRESHOLD;

      if (oppositeMovement) {

        oppositeMovementCount++;

        if (oppositeMovementCount >= REQUIRED_FRAMES) {

          console.log('Opposite head movement detected');

          this.updateUI(() => {
            this.scanInstruction =
              'Head movement detected. Comparing your face...';
          });

          return;
        }

      } else {

        oppositeMovementCount = 0;

      }
    }

    await this.wait(100);
  }
  console.log('TensorFlow backend before live detection:', tf.getBackend());

console.log('Video ready state:', video.readyState);

console.log('Video dimensions:', video.videoWidth, video.videoHeight);

console.log('Camera stream active:', this.cameraStream?.active);

  throw new Error(
    'Live face detection timed out. Please check lighting, camera position and try again.'
  );
}

  // ---------------------------------------
  // LOAD REFERENCE IMAGE
  // ---------------------------------------

  private createImage(
    source: string
  ): Promise<HTMLImageElement> {

    return new Promise((resolve, reject) => {

      const image = new Image();

      image.onload = () => {

        if (
          image.naturalWidth === 0 ||
          image.naturalHeight === 0
        ) {
          reject(new Error('The reference image is empty.'));
          return;
        }

        resolve(image);
      };

      image.onerror = () => {
        reject(
          new Error('Unable to load the registered reference photo.')
        );
      };

      image.src = source;

    });
  }

  // ---------------------------------------
  // GET EXACTLY ONE FACE DESCRIPTOR
  // ---------------------------------------

  private async getSingleFaceDescriptor(
    image: HTMLImageElement
  ): Promise<Float32Array> {

    const confidenceLevels = [0.5, 0.35, 0.25];

    for (const confidence of confidenceLevels) {

      const detections = await faceapi
        .detectAllFaces(
          image,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 160,
            scoreThreshold: 0.3
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      console.log(
        'Image faces detected:',
        detections.length,
        'Confidence:',
        confidence
      );

      if (detections.length > 1) {
        throw new Error(
          'More than one face was detected. Use an image containing only the employee.'
        );
      }

      if (detections.length === 1) {
        return detections[0].descriptor;
      }
    }

    throw new Error(
      'No clear face detected. Please check the lighting and face position.'
    );
  }
  
  // ---------------------------------------
  // CAPTURE A FRAME FROM LIVE VIDEO
  // ---------------------------------------
 
  private captureLiveFrame(
    video: HTMLVideoElement
  ): HTMLImageElement {

    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to process the live camera image.');
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const image = new Image();

    image.src = canvas.toDataURL('image/jpeg', 0.95);

    return image;
  }

  private async getCapturedFrameImage(
    video: HTMLVideoElement
  ): Promise<HTMLImageElement> {

    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to process the camera frame.');
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageSource = canvas.toDataURL('image/jpeg', 0.95);

    return this.createImage(imageSource);
  }

  // ---------------------------------------
  // MAIN FACE VERIFICATION
  // ---------------------------------------

  async verifyFace(): Promise<void> {

    if (this.isScanning) {
      return;
    }

    this.updateUI(() => {

      this.isScanning = true;

      this.resultStatus = '';

      this.errorMessage = '';

      this.scanInstruction =
        'Loading AI models...';

    });

    try {

      // STEP 1: LOAD MODELS.
      console.log('STEP 1: Loading AI models');

      await this.loadModels();

      // STEP 2: LOAD REGISTERED REFERENCE PHOTO.
      console.log('STEP 2: Loading registered face');

      const referenceImage =
        await this.createImage(this.REFERENCE_IMAGE_URL);

      const referenceDescriptor =
        await this.getSingleFaceDescriptor(referenceImage);

      console.log('Registered face descriptor created');

      // STEP 3: OPEN LIVE CAMERA.
      console.log('STEP 3: Starting live camera');

      this.updateUI(() => {
        this.scanInstruction =
          'Opening front camera...';
      });

      const video = await this.startLiveCamera();

      // STEP 4: VERIFY ACTUAL HEAD MOVEMENT.
      console.log('STEP 4: Checking live head movement');

      await this.verifyHeadMovement(video);

      // STEP 5: CAPTURE LIVE VIDEO FRAME.
      console.log('STEP 5: Capturing verified live frame');

      const capturedImage =
        await this.getCapturedFrameImage(video);

      // STEP 6: GENERATE SELFIE DESCRIPTOR.
      const selfieDescriptor =
        await this.getSingleFaceDescriptor(capturedImage);

      console.log('Selfie descriptor created');

      // STEP 7: COMPARE FACES.
      console.log('STEP 6: Comparing registered and live face');

      const distance = faceapi.euclideanDistance(
        referenceDescriptor,
        selfieDescriptor
      );

      console.log('Face distance:', distance);

      if (!Number.isFinite(distance)) {
        throw new Error('Face comparison returned an invalid result.');
      }

      const isMatch = distance <= this.MATCH_THRESHOLD;

      this.updateUI(() => {

        if (isMatch) {

          this.resultStatus = 'Verified';

          this.errorMessage = '';

        } else {

          this.resultStatus = 'Not Verified';

          this.errorMessage = '';

        }

        this.saveVerificationStatus(this.resultStatus);

      });

      console.log(
        isMatch
          ? 'FACE VERIFICATION: VERIFIED'
          : 'FACE VERIFICATION: NOT VERIFIED'
      );

    } catch (error: any) {

      console.error('Face verification failed:', error);

      this.updateUI(() => {

        this.resultStatus = 'Verification Failed';

        this.errorMessage =
          error?.message ||
          'Face verification failed. Please try again.';

        this.saveVerificationStatus(this.resultStatus);

      });

    } finally {

      this.stopLiveCamera();

      this.updateUI(() => {

        this.isScanning = false;

        this.scanInstruction = '';

      });

    }
  }

  // ---------------------------------------
  // RESET
  // ---------------------------------------

  resetAll(): void {

    if (this.isScanning) {
      return;
    }

    this.stopLiveCamera();

    this.updateUI(() => {

      this.resultStatus = '';

      this.errorMessage = '';

      this.scanInstruction = '';

    });
  }

  // ---------------------------------------
  // ALERT
  // ---------------------------------------

  async showAlert(
    header: string,
    message: string
  ): Promise<void> {

    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }

}
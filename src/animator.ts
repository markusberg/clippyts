import {
  AgentConfig,
  AgentSound,
  AgentType,
  AgentWrapper,
  AgentAnimation,
  Frame,
  FrameImage,
} from './agents/types.js'

export default class Animator {
  public static States = { WAITING: 1, EXITED: 0 }

  private _data: AgentConfig
  private _name: AgentType
  private _currentFrameIndex: number = 0
  private _path: string
  private _exiting: boolean = false
  private _currentFrame?: Frame = undefined
  private _started: boolean = false
  private _sounds: Record<string, HTMLAudioElement>
  private _overlays: HTMLElement[] = []
  private _endCallback?: Function = undefined

  private _currentAnimation?: AgentAnimation = undefined
  public currentAnimationName: string | undefined = undefined
  private _loop?: number

  constructor(
    private _el: HTMLElement,
    config: AgentWrapper,
  ) {
    this._name = config.name
    this._data = config.config
    this._path = config.path
    this._sounds = this.preloadSounds(config.sound)

    const size = this._data.framesize
    const container = [
      `display: block`,
      `width: ${size[0]}px`,
      `height: ${size[1]}px`,
    ].join(';')
    this._el.setAttribute('style', container)
    let current = this._el

    for (let i = 0; i < this._data.overlayCount; i++) {
      const inner = this._setupElement(document.createElement('div'), size)
      current.append(inner)
      this._overlays.push(inner)
      current = inner
    }
  }

  private _setupElement(el: HTMLElement, size: FrameImage) {
    const style = [
      'display: none',
      `width: ${size[0]}px`,
      `height: ${size[1]}px`,
      `background: url('${this._path}/${this._name}/map.png') no-repeat`,
    ].join(';')
    el.setAttribute('style', style)

    return el
  }

  get animations(): string[] {
    return Object.keys(this._data.animations).sort()
  }

  private preloadSounds(sounds: AgentSound): Record<string, HTMLAudioElement> {
    const preloaded: Record<string, HTMLAudioElement> = {}
    for (const key in sounds) {
      const uri = sounds[key]
      preloaded[key] = new Audio(uri)
    }
    return preloaded
  }

  hasAnimation(name: string) {
    return !!this._data.animations[name]
  }

  exitAnimation() {
    this._exiting = true
  }

  /**
   * Is the currently running animation an idle animation?
   * @returns
   */
  isIdle(): boolean {
    return this.currentAnimationName?.includes('Idle') || false
  }

  showAnimation(animationName: string, stateChangeCallback: Function) {
    this._exiting = false

    if (!this.hasAnimation(animationName)) {
      return false
    }

    this._currentAnimation = this._data.animations[animationName]
    this.currentAnimationName = animationName

    if (!this._started) {
      this._step()
      this._started = true
    }

    this._currentFrameIndex = 0
    this._currentFrame = undefined
    this._endCallback = stateChangeCallback

    return true
  }

  private _draw(images: FrameImage[] | undefined) {
    if (!images) {
      return
    }

    this._overlays.forEach((overlay, idx) => {
      if (idx < images.length) {
        const xy = images[idx]
        const position = `-${xy[0]}px -${xy[1]}px`
        overlay.style['display'] = 'block'
        overlay.style['background-position' as any] = position
      } else {
        overlay.style['display'] = 'none'
      }
    })
  }

  private _getNextAnimationFrame(): number {
    if (!this._currentAnimation) return 0
    // No current frame. start animation.
    if (!this._currentFrame) return 0
    let currentFrame = this._currentFrame
    let branching = this._currentFrame.branching

    if (this._exiting && currentFrame.exitBranch !== undefined) {
      return currentFrame.exitBranch
    } else if (branching) {
      let rnd = Math.random() * 100
      for (let i = 0; i < branching.branches.length; i++) {
        let branch = branching.branches[i]
        if (rnd <= branch.weight) {
          return branch.frameIndex
        }

        rnd -= branch.weight
      }
    }

    return this._currentFrameIndex + 1
  }

  /**
   * Play the provided sound, if it exists
   * @param id
   */
  private _playSound(id: string | undefined) {
    if (id) {
      const audio = this._sounds[id]
      if (audio) {
        console.log(`${this._name}: ${id}`)
        audio.play()
      }
    }
  }

  private _render(frame: Frame) {
    this._draw(frame.images)
    this._playSound(frame.sound)
  }

  private _atLastFrame() {
    if (!this._currentAnimation) return false
    return this._currentFrameIndex >= this._currentAnimation.frames.length - 1
  }

  private _step() {
    if (!this._currentAnimation) {
      return
    }
    const newFrameIndex = Math.min(
      this._getNextAnimationFrame(),
      this._currentAnimation.frames.length - 1,
    )
    const frameChanged =
      !this._currentFrame || this._currentFrameIndex !== newFrameIndex
    this._currentFrameIndex = newFrameIndex

    // always switch frame data, unless we're at the last frame of an animation with a useExitBranching flag.
    if (!(this._atLastFrame() && this._currentAnimation.useExitBranching)) {
      this._currentFrame =
        this._currentAnimation.frames[this._currentFrameIndex]
    }

    if (this._currentFrame) {
      this._render(this._currentFrame)
    }

    this._loop = window.setTimeout(
      this._step.bind(this),
      this._currentFrame!.duration,
    )

    // fire events if the frames changed and we reached an end
    if (this._endCallback && frameChanged && this._atLastFrame()) {
      if (this._currentAnimation.useExitBranching && !this._exiting) {
        this._endCallback(this.currentAnimationName, Animator.States.WAITING)
      } else {
        this._endCallback(this.currentAnimationName, Animator.States.EXITED)
      }
    }
  }

  /***
   * Pause animation execution
   */
  pause() {
    window.clearTimeout(this._loop)
  }

  /***
   * Resume animation
   */
  resume() {
    this._step()
  }
}

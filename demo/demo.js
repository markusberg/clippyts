import { load } from '../dist/index.js'

class Clippy {
  _selector = null
  _path = null
  _agent = null
  _interval = null
  agentName = null

  constructor(selector, path) {
    this._selector = selector
    this._path = path
  }

  availableAgents = [
    'Bonzi',
    'Clippy',
    'F1',
    'Genie',
    'Genius',
    'Links',
    'Merlin',
    'Peedy',
    'Rocky',
    'Rover',
  ]

  talks = [
    'How can i help you?',
    'Nice day!',
    'Glad to meet you.',
    'At your service',
    'Helloo',
  ]

  async nextAgent() {
    const idx = Math.floor(Math.random() * this.availableAgents.length)
    this.agentName = this.availableAgents[idx]

    try {
      this._agent = await load(this.agentName, this._path, this._selector)
      console.log(this._agent.animations())
      this._agent.show()

      this.speak()

      // Animate randomly
      this._interval = setInterval(
        () => this._agent.animate(),
        3000 + Math.random() * 4000,
      )
    } catch (err) {
      console.error(err)
    }
  }

  speak() {
    const idx = Math.floor(Math.random() * this.talks.length)
    this._agent.speak(`I am ${this.agentName}, ${this.talks[idx]}`)
    this._agent.animate()
  }

  destroy() {
    this._agent.stop()
    const $el = document.getElementById(this._selector)
    $el && ($el.innerHTML = '')
    clearInterval(this._interval)
  }
}

window.onload = () => {
  const clippy = new Clippy('my-clippy', '/dist/agents')

  const startButton = document.getElementById('start-button')
  const demoArea = document.getElementById('demo-area')
  startButton.addEventListener('click', () => {
    demoArea.style['visibility'] = 'visible'
    startButton.style['display'] = 'none'
    clippy.nextAgent()
  })
  document.getElementById('agent-next').addEventListener('click', () => {
    clippy.destroy()
    clippy.nextAgent()
  })
  document.getElementById('agent-speak').addEventListener('click', () => {
    clippy.speak()
  })
}

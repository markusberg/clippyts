import Agent from './agent.js'
import type Animator from './animator.js'
import type Queue from './queue.js'
import type Balloon from './balloon.js'
import {
  AgentConfig,
  AgentSound,
  AgentType,
  AgentWrapper,
} from './agents/types.js'

export type { Agent, Animator, Queue, Balloon }

export async function load(
  name: AgentType,
  path: string,
  selector?: string,
): Promise<Agent> {
  const config = await loadAgentConfig(name, path)
  const sound = await loadSound(name, path)
  const agent: AgentWrapper = { name, path, config, sound }
  return new Agent(agent, selector)
}

async function loadAgentConfig(
  name: string,
  path: string,
): Promise<AgentConfig> {
  const url = `${path}/${name}/agent.json`
  const result = await fetch(url)
  if (result.ok) {
    const agent: AgentConfig = await result.json()
    return agent
  }
  throw result
}

async function loadSound(name: string, path: string): Promise<AgentSound> {
  try {
    const audio = document.createElement('audio')
    const canPlayMp3 = '' !== audio.canPlayType('audio/mpeg')
    const canPlayOgg = '' !== audio.canPlayType('audio/ogg; codecs="vorbis"')

    if (!canPlayMp3 && !canPlayOgg) {
      throw new Error('Unable to play mp3 or ogg')
    }
    const filename = canPlayMp3 ? 'sounds-mp3' : 'sounds-ogg'
    const url = `${path}/${name}/${filename}.json`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Unable to download sounds: ${url}`)
    }

    const sounds: AgentSound = await response.json()
    return sounds
  } catch (err) {
    console.error(err)
    return {}
  }
}

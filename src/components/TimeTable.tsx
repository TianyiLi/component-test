import { Observer, observer, useLocalObservable } from 'mobx-react-lite'
import range from 'lodash/range'
import styled from 'styled-components'
import React, { useRef, useState } from 'react'
import { action, computed, makeAutoObservable, observable } from 'mobx'
import { Button } from 'antd'
const AvailableTime = range(0, 24)
const weekDays = range(0, 7)
const TimeTableStyled = styled.div`
  table {
    font-family: Sans-serif;
    background-color: #fff;
    border-collapse: separate;
    user-select: none;
  }

  th.rotate {
    /* Something you can count on */
    height: 140px;
    white-space: nowrap;
  }
  tbody > tr td {
    text-align: center;
  }
  tbody > tr td:nth-of-type(odd):not(.active) {
    background-color: #f0f7fd;
  }
  tbody > tr:nth-of-type(even) {
    background-color: #fbfbfb;
  }
  tbody > tr:hover {
    background-color: #f5f5f5;
    td:not(.active) {
      background-color: transparent;
    }
  }
  tbody td.active {
    background-color: red;
  }
  .cell-item,
  .shift-checker {
    cursor: inherid;
  }
  .rotate {
    cursor: default;
  }
  .rotate span:hover {
    /* span.secondary {
      font-size: initial;
    } */
  }
  /* span.secondary {
    color: #e2e2e2;
    font-size: xx-small;
    font-weight: lighter;
    &:hover {
      font-size: initial;
    }
  } */
  .row-header .secondary {
    font-size: small;
    color: #a2a2a2;
    padding-right: 10px;
    padding-left: 10px;
    float: right;
    &:hover {
      font-size: small;
    }
  }
  th.row-header {
    text-align: left;
  }
  th.rotate > div {
    transform: 
    /* Magic Numbers */ translate(2px, 60px)
      /* 45 is really 360 - 45 */ rotate(330deg);
    width: 1.8em;
  }
  div.month {
    transform: translate(1.8em, 40px) rotate(0);
    background-color: #eee;
    width: 1.8em;
    padding: 5px;
    border-radius: 3px;
    display: inherit;
  }
  th.rotate > div > span {
    border-bottom: 0px solid #ccc;
    padding: 5px 10px;
  }
`
class TimeTableControl {
  @observable timeList: number[][] = weekDays.map(() =>
    Array.from({ length: 24 }, (_) => 0)
  )

  /**
   * [time X, timeList Y]
   *
   * @memberof TimeTableControl
   */
  @observable
  currentSession = {
    origin: [-1, -1] as [number, number],
    end: [-1, -1] as [number, number],
    turnHighLight: true,
  }

  active = false

  constructor() {
    makeAutoObservable(this)
    this.mouseDown = this.mouseDown.bind(this)
  }

  private readIndex(
    e: React.MouseEvent<HTMLTableElement>
  ): [string, number, number] | false {
    const dataIndex = (e.target as HTMLElement).getAttribute('data-index')
    if (!dataIndex) return false
    const [day, time, timeListIndex] = dataIndex.split(' ')
    return [day, +time, +timeListIndex]
  }

  @action
  mouseDown(e: React.MouseEvent<HTMLTableElement>) {
    this.active = true
    const data = this.readIndex(e)
    if (!data) return false
    const [day, time, timeListIndex] = data
    this.currentSession.origin = [time, timeListIndex]
    this.currentSession.end = [time, timeListIndex]
    this.currentSession.turnHighLight = !this.timeList[timeListIndex][time]
  }

  @action
  mouseMove(e: React.MouseEvent<HTMLTableElement>) {
    if (!this.active) return false
    const data = this.readIndex(e)
    if (!data) return false
    const [day, time, timeListIndex] = data
    if (this.currentSession.origin.every((e) => e === -1)) {
      this.currentSession.origin = [time, timeListIndex]
      this.currentSession.turnHighLight = !this.timeList[timeListIndex][time]
    }
    this.currentSession.end = [time, timeListIndex]
  }

  @action
  mouseUp(e: React.MouseEvent<HTMLTableElement>) {
    if (!this.active) return
    this.active = false
    const data = this.readIndex(e)
    let day: string
    let time: number
    let timeListIndex: number
    if (data) {
      ;[day, time, timeListIndex] = data
    } else {
      ;[day, time, timeListIndex] = ['', ...this.currentSession.end]
    }
    // cal the position
    const diff = timeListIndex - this.currentSession.origin[1]
    const cond = (current: number) =>
      diff < 0 ? current >= timeListIndex : current <= timeListIndex
    const min = Math.min(
      this.currentSession.origin[0],
      time,
      this.currentSession.end[0]
    )
    const max = Math.max(
      this.currentSession.origin[0],
      time,
      this.currentSession.end[0]
    )

    const isHighLight = +!this.timeList[this.currentSession.origin[1]][
      this.currentSession.origin[0]
    ]
    console.log(isHighLight)

    for (
      let timeListI = this.currentSession.origin[1];
      cond(timeListI);
      diff < 0 ? timeListI-- : timeListI++
    ) {
      for (let j = min; j <= max; j++) {
        this.timeList[timeListI][j] = isHighLight
      }
    }

    this.currentSession.end = [-1, -1]
    this.currentSession.origin = [-1, -1]
    this.currentSession.turnHighLight = false
  }

  @action
  resetGrid() {
    this.timeList = []
  }
}

const inRange = (
  scope: { origin: [number, number]; end: [number, number] },
  current: [number, number]
) => {
  const startY = Math.min(scope.origin[1], scope.end[1])
  const endY = Math.max(scope.origin[1], scope.end[1])
  const startX = Math.min(scope.origin[0], scope.end[0])
  const endX = Math.max(scope.origin[0], scope.end[0])
  return (
    current[1] >= startY &&
    current[1] <= endY &&
    current[0] >= startX &&
    current[0] <= endX
  )
}

function shouldHighLight(x: number, y: number, state: TimeTableControl) {
  if (!state.active) {
    return state.timeList[y][x]
  } else {
    const isInRange = inRange(state.currentSession, [x, y])
    const isHighLight = state.currentSession.turnHighLight
    if (!isInRange) return state.timeList[y][x]
    else {
      return isHighLight
    }
  }
}

export const TimeTable = observer(() => {
  const [state] = useState(() => new TimeTableControl())

  return (
    <TimeTableStyled>
      <Button onClick={() => state.resetGrid()}>reset</Button>
      <table
        onMouseDown={state.mouseDown.bind(state)}
        onMouseUp={state.mouseUp.bind(state)}
        onMouseMove={state.mouseMove.bind(state)}
        onMouseLeave={state.mouseUp.bind(state)}
      >
        <thead>
          <tr>
            <td>Weekday</td>
            {AvailableTime.map((hour) => (
              <td className="rotate" key={hour}>
                <div>
                  <span>
                    {hour} ~ {hour + 1}
                  </span>
                </div>
              </td>
            ))}
          </tr>
        </thead>
        <tbody onMouseDown={console.log}>
          {weekDays.map((day, i) => (
            <tr onMouseDown={console.log} key={day}>
              <td>{day}</td>
              {AvailableTime.map((time) => (
                <Observer>
                  {() => (
                    <td
                      key={time}
                      {...{ 'data-index': `${day} ${time} ${i}` }}
                      className={
                        shouldHighLight(time, day, state)
                          ? 'cell-item active'
                          : 'cell-item in-active'
                      }
                    ></td>
                  )}
                </Observer>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TimeTableStyled>
  )
})

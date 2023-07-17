import {Component, OnInit} from '@angular/core';
import {ToastrService} from "ngx-toastr";

interface Node {
  id: number;
  weight: number;
  color: string;
  rowCol: number[];
  isWall: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  size = 8;
  matrix: Node[][] = [];
  adjacencyList = new Map<number, Node[]>();

  nodeMap = new Map<number, Node>();
  startNode: Node | undefined = undefined;
  destinationNode: Node | undefined = undefined;
  destinationReachable = true;
  wallNodes: Node[] = [];

  editStartNode = false;
  editEndNode = false;
  editWall = false;
  simulationStarted = false;
  resetDisabled = false;

  constructor(private toastr: ToastrService) {}

  async ngOnInit() {
    this.initializeMatrix();
  }

  initializeMatrix() {
    let counter = 1;
    for (let i = 0; i < this.size; i++) {
      const arr: Node[] = [];
      for (let j = 0; j < this.size; j++) {
        const node = {
          id: counter,
          weight: 0,
          color: 'white',
          rowCol: [i, j],
          isWall: false,
        };
        arr.push(node);
        this.nodeMap.set(counter, node);
        counter++;
      }
      this.matrix.push(arr);
    }
  }

  startSimulation = async () => {
    if (!this.startNode) {
      this.toastr.error('Please select Start Node');
      return;
    }

    if (!this.destinationNode) {
      this.toastr.error('Please select End Node');
      return;
    }

    this.simulationStarted = true;
    this.resetDisabled = true;

    this.buildAdjacencyList();

    await this.bfsSimulation(this.startNode!);
  };

  buildAdjacencyList() {
    for (let row = 0; row < this.matrix.length; row++) {
      for (let col = 0; col < this.matrix.length; col++) {
        const currNode = this.matrix[row][col];
        if (!currNode.isWall) {
          this.adjacencyList.set(currNode.id, []);
          if (col + 1 < this.size) {
            if (!this.matrix[row][col + 1].isWall) {
              this.adjacencyList
                .get(currNode.id)
                ?.push(this.matrix[row][col + 1]);
            }
          }

          if (row + 1 < this.size) {
            if (!this.matrix[row + 1][col].isWall) {
              this.adjacencyList
                .get(currNode.id)
                ?.push(this.matrix[row + 1][col]);
            }
          }

          if (col - 1 > -1) {
            if (!this.matrix[row][col - 1].isWall) {
              this.adjacencyList
                .get(currNode.id)
                ?.push(this.matrix[row][col - 1]);
            }
          }

          if (row - 1 > -1) {
            if (!this.matrix[row - 1][col].isWall) {
              this.adjacencyList
                .get(currNode.id)
                ?.push(this.matrix[row - 1][col]);
            }
          }
        }
      }
    }
  }

  bfsSimulation = async (start: Node) => {
    const level = new Map<number, number>();
    level.set(start.id, 0);

    const parent = new Map<number, Node>();
    parent.set(start.id, start);

    let destNodeFound = false;

    let i = 1;
    let frontier = [start.id];
    while (frontier.length) {
      const next: number[] = [];
      for (let u of frontier) {
        for (let v of this.adjacencyList.get(u)!) {
          if (!level.has(v.id)) {
            next.push(v.id);
            level.set(v.id, i);
            parent.set(v.id, this.nodeMap.get(u)!);

            await this.updateNodeColorWithDelay(v, 'green', 100);

            if (v.id === this.destinationNode?.id) {
              destNodeFound = true;
              break;
            }
          }
        }

        if (destNodeFound) {
          break;
        }
      }

      if (destNodeFound) {
        break;
      }

      frontier = next;
      i += 1;
    }

    if (!destNodeFound) {
      this.destinationReachable = false;
      return;
    }

    await this.delay(500);

    if (this.destinationNode && this.startNode) {
      let curr = this.destinationNode;
      while (curr.id != this.startNode.id) {
        await this.updateNodeColorWithDelay(curr, 'orange', 200);
        curr = parent.get(curr.id)!;
      }
      await this.updateNodeColorWithDelay(curr, 'orange', 200);

      await this.updateNodeColorWithDelay(this.startNode, 'yellow', 300);
      await this.updateNodeColorWithDelay(this.destinationNode, 'yellow', 100);
    }

    this.resetDisabled = false;
  };

  updateNodeColorWithDelay = async (
    node: Node,
    color: string,
    delay: number
  ) => {
    await this.delay(delay);
    this.matrix[node.rowCol[0]][node.rowCol[1]] = {
      ...node,
      color,
    };
  };

  nodeClick(node: Node) {
    if (this.editWall) {
      this.toggleWall(node);
    } else if (this.editStartNode) {
      this.updateStartNode(node);
    } else if (this.editEndNode) {
      this.updateEndNode(node);
    }
  }

  selectStartNodeClick() {
    this.editStartNode = true;

    this.editEndNode = false;
    this.editWall = false;
  }

  selectEndNodeClick() {
    this.editEndNode = true;

    this.editStartNode = false;
    this.editWall = false;
  }

  selectAddWallClick() {
    this.editWall = true;

    this.editStartNode = false;
    this.editEndNode = false;
  }

  updateStartNode(node: Node) {
    if (this.startNode) {
      this.matrix[this.startNode.rowCol[0]][this.startNode.rowCol[1]] = {
        ...this.startNode,
        color: 'white',
      };
    }

    if (this.matrix[node.rowCol[0]][node.rowCol[1]].isWall) {
      this.toastr.error('Selected Node is a wall');
      return;
    }

    if (this.destinationNode?.id === node.id) {
      this.toastr.error('Destination Node cannot be Start Node');
      return;
    }

    this.startNode = node;
    this.matrix[node.rowCol[0]][node.rowCol[1]] = { ...node, color: 'yellow' };
    this.editStartNode = false;
  }

  updateEndNode(node: Node) {
    if (this.destinationNode) {
      this.matrix[this.destinationNode.rowCol[0]][
        this.destinationNode.rowCol[1]
        ] = {
        ...this.destinationNode,
        color: 'white',
      };
    }

    if (this.matrix[node.rowCol[0]][node.rowCol[1]].isWall) {
      this.toastr.error('Selected Node is a wall');
      return;
    }

    if (this.startNode?.id === node.id) {
      this.toastr.error('Start Node cannot be Destination Node');
      return;
    }

    this.destinationNode = node;
    this.matrix[node.rowCol[0]][node.rowCol[1]] = { ...node, color: 'yellow' };
    this.editEndNode = false;
  }

  toggleWall(node: Node) {
    if (this.simulationStarted) {
      return;
    }

    if (node.id == this.startNode?.id || node.id == this.destinationNode?.id) {
      return;
    }

    const row = node.rowCol[0];
    const col = node.rowCol[1];

    if (this.matrix[row][col].isWall) {
      this.matrix[row][col] = {
        ...this.matrix[row][col],
        isWall: false,
        color: 'white',
      };
    } else {
      this.matrix[row][col] = {
        ...this.matrix[row][col],
        isWall: true,
        color: 'grey',
      };
    }
  }

  getNodeClassNames(node: Node) {
    return {
      black: node.color === 'black',
      green: node.color === 'green',
      orange: node.color === 'orange',
      yellow: node.color === 'yellow',
      grey: node.color === 'grey',
    };
  }

  reset() {
    this.matrix = [];
    this.adjacencyList = new Map<number, Node[]>();
    this.nodeMap = new Map<number, Node>();

    this.initializeMatrix();

    this.startNode = undefined;
    this.destinationNode = undefined;
    this.destinationReachable = true;
    this.wallNodes = [];

    this.editStartNode = false;
    this.editEndNode = false;
    this.editWall = false;
    this.simulationStarted = false;
  }

  delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
}

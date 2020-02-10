---
title: "A*（A星） 算法 Java 实现"
date: 2018-6-29 21:30
tags:
- 'A*'
- 'Algorithm'
- 'Java'

categories:
  - "技术"

description: "在某件机缘巧合（实际上是曲折的辛酸故事）的事情发生之后，我接到了通过 Javascript 实现一个 A* 算法任务..."
---

# 前言

在某件机缘巧合（实际上是曲折的辛酸故事）的事情发生之后，我接到了通过 Javascript 实现一个 A* 算法任务。

讲道理我在一开始接到的时候还不知道这个是什么东西...后面阅读下面的文章之后才有所了解：

- [A*寻路算法](http://www.cppblog.com/christanxw/archive/2006/04/07/5126.html)

上面这篇文章是译文，原文已经 404 了，好在本文翻译的还不错。我看了这篇文章才了解了这些东西。

本文章不鹦鹉学舌，误导读者。所以不会再赘述算法的流程，诸君看上述版本即可~

再接着就是实现：

- [js 实现 A* 寻路算法](https://www.cnblogs.com/huansky/p/5572631.html)

我的 js 实现也基本参考他的做的。当然，我是在 Cocos Creator 上搭建了场景实现了，所以其中还有相当一部分是关于 Cocos Creator 的应用。此处先按下不表。

下面推荐一个很有意思的 Github 项目，他这个实现了诸多寻找路径的算法！还有网页版！你可以看看实现过程以助于你理解算法。

- [PathFinding.js visual](http://qiao.github.io/PathFinding.js/visual/)

---

实现了 js 版本，我想着用我的老本行 Java 来实现故而有了如下的代码。

**注意！因为写得匆忙，所以没有写测试代码。如有错漏，请见谅！并烦请赐教**~

# A* 算法 Java 实现

```java
public class AStarFinder {
    // 分别是：直行成本，斜行成本，地图宽度和地图高度
    private static final int STRAIGHT_COST = 10;
    private static final int OBLIQUE_COST = 14;
    private static final int MAP_WIDTH = 960;
    private static final int MAP_HEIGHT = 480;

  /**
     * 节点内部类，设有坐标、f, g, h 等变量
     */
    class Pos{
        private int x;
        private int y;
        private int g;
        private int h;
        private int f;
        private Pos parent;

        public Pos(int x, int y) {
            this.x = x;
            this.y = y;
        }

        public int getX() {
            return x;
        }

        public void setX(int x) {
            this.x = x;
        }

        public int getY() {
            return y;
        }

        public void setY(int y) {
            this.y = y;
        }

        public int getG() {
            return g;
        }

        public void setG(int g) {
            this.g = g;
        }

        public int getH() {
            return h;
        }

        public void setH(int h) {
            this.h = h;
        }

        public int getF() {
            return f;
        }

        public void setF(int f) {
            this.f = f;
        }

        public Pos getParent() {
            return parent;
        }

        public void setParent(Pos parent) {
            this.parent = parent;
        }
    }

    /**
     * 路径查找方法
     * @param startX 起始点 x 坐标
     * @param startY 起始点 y 坐标
     * @param endX  终点 x 坐标
     * @param endY  终点 y 坐标
     * @return 返回路径坐标集合
     */
    public ArrayList<Pos> searchRoad(int startX, int startY, int endX, int endY){

        // 分别是打开点列表、关闭点列表、结果点列表和障碍点列表
        ArrayList<Pos> openList = new ArrayList<>();
        ArrayList<Pos> closeList = new ArrayList<>();
        ArrayList<Pos> resultList = new ArrayList<>();
        ArrayList<Pos> barriersList = getBarriersList();
        // 结果节点的索引
        int resultIndex = -1;
        // 是否获得了结果
        boolean isGetResult = false;

        // 将当前点加入开启列表中
        openList.add(new Pos(startX, startY));

        do {
            // 先将当前节点取出并加入关闭列表之中
            Pos currentPoint = openList.get(0);
            closeList.add(currentPoint);
            // 获取周围八个点的集合，并轮询
            ArrayList<Pos> surroundPoints = getSurroundPoints(currentPoint);
            for (Pos pos : surroundPoints){
                // 是否是障碍点
                boolean isBarrier = barriersList.contains(pos);
                // 是否是关闭列表中的点
                boolean isExistList = closeList.contains(pos);
                // 是否是在地图范围内
                boolean isInMap = pos.x >= 0 && pos.x < MAP_WIDTH/2 &&
                        pos.y >= 0 && pos.y <= MAP_HEIGHT/2;

                if (!isExistList && !isBarrier && isInMap){
                    // 均是，计算 g 值
                    int g = currentPoint.g +
                            ((currentPoint.x - pos.x) * (currentPoint.y - pos.y) == 0 ? STRAIGHT_COST : OBLIQUE_COST);
                    // 如果当前点不在打开点中，那么计算 h, f 值，并加入进入
                    if (!openList.contains(pos)){
                        pos.h = Math.abs(endX - pos.x) * 10 + Math.abs(endY - pos.y) * 10;
                        pos.g = g;
                        pos.f = pos.g + pos.h;
                        pos.parent = currentPoint;
                        openList.add(pos);
                    }else {
                        // 如果在打开点列表中，那么重新计算 g 和 f，因为 g 当前位置相关
                        int index = openList.indexOf(pos);
                        if (g < openList.get(index).g){
                            openList.get(index).parent = currentPoint;
                            openList.get(index).g = g;
                            openList.get(index).f = g + openList.get(index).h;
                        }
                    }
                }
                if (openList.isEmpty()){
                    System.out.println("没有可用通路");
                    break;
                }

                // 对打开点列表进行升序排序，每次都获得第一个 f 为最小
                openList.sort(new Comparator<Pos>() {
                    @Override
                    public int compare(Pos o1, Pos o2) {
                        return Integer.compare(o1.f, o2.f);
                    }
                });
            }
            // 遍历打开点列表看结果点是否在其中
            for (Pos tmpPos : openList){
                if (tmpPos.x == endX && tmpPos.y == endY){
                    isGetResult = true;
                    resultIndex = openList.indexOf(tmpPos);
                }
            }

        }while (isGetResult);

        if (resultIndex == -1){
            // 如果索引值为 -1 ，那么说明没有结果点
            return null;
        }else {
            // 获取路径
            Pos currentPos = openList.get(resultIndex);
            do {
                resultList.add(currentPos);
                currentPos = currentPos.parent;
            }while (currentPos.x != startX || currentPos.y != startY);
        }
        return resultList;
    }

    /**
     * 获取障碍物区域坐标集合
     * @return 返回坐标集合
     */
    private ArrayList<Pos> getBarriersList(){
        // @to-do

        return new ArrayList<Pos>();
    }

    /**
     * 获取周围八个节点函数
     * @param currentPoint 当前点
     * @return  返回八个存有节点的集合
     */
    private ArrayList<Pos> getSurroundPoints(Pos currentPoint){
        int x = currentPoint.x;
        int y = currentPoint.y;

        ArrayList<Pos> surroundPoints = new ArrayList<>();
        surroundPoints.add(new Pos(x - 1, y - 1));
        surroundPoints.add(new Pos(x , y - 1));
        surroundPoints.add(new Pos(x + 1, y - 1));
        surroundPoints.add(new Pos(x + 1, y));
        surroundPoints.add(new Pos(x + 1, y + 1));
        surroundPoints.add(new Pos(x, y + 1));
        surroundPoints.add(new Pos(x - 1, y + 1));
        surroundPoints.add(new Pos(x - 1, y));

        return surroundPoints;
    }


}

```
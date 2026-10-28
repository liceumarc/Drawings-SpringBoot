package cat.esliceu.drawing.demo.models;


import java.util.List;

public class Figure {

    private enum typeFigure {
        CIRCLE,
        SQUARE,
        TRIANGLE,
        RECTANGLE,
        POLYGON,
        LINE,
        ELLIPSE,
        OTHER
    }

    private String name;
    private typeFigure type;
    private List<Point> points;
    private String color;
    private int size;

    public Figure(String name, typeFigure type, List<Point> points, String color, int size) {
        this.name = name;
        this.type = type;
        this.points = points;
        this.color = color;
        this.size = size;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public typeFigure getType() {
        return type;
    }

    public void setType(typeFigure type) {
        this.type = type;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public List<Point> getPoints() {
        return points;
    }

    public void setPoints(List<Point> points) {
        this.points = points;
    }
}
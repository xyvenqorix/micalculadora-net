from http.server import BaseHTTPRequestHandler
import json
import ast
import operator


OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
}


def calculate_node(node):

    if isinstance(node, ast.Expression):
        return calculate_node(node.body)

    if isinstance(node, ast.Constant):

        if isinstance(node.value, (int, float)):
            return node.value

        raise ValueError("Número no válido")

    if isinstance(node, ast.UnaryOp):

        value = calculate_node(node.operand)

        if isinstance(node.op, ast.USub):
            return -value

        if isinstance(node.op, ast.UAdd):
            return value

        raise ValueError("Operador no válido")

    if isinstance(node, ast.BinOp):

        left = calculate_node(node.left)
        right = calculate_node(node.right)

        operation = OPERATORS.get(type(node.op))

        if operation is None:
            raise ValueError("Operador no permitido")

        if isinstance(node.op, ast.Div) and right == 0:
            raise ZeroDivisionError(
                "No se puede dividir entre cero"
            )

        return operation(left, right)

    raise ValueError("Expresión no válida")


def calculate_expression(expression):

    if not expression:
        raise ValueError(
            "La expresión está vacía"
        )

    if len(expression) > 200:
        raise ValueError(
            "Expresión demasiado larga"
        )

    tree = ast.parse(
        expression,
        mode="eval"
    )

    return calculate_node(tree)


class handler(BaseHTTPRequestHandler):

    def do_POST(self):

        try:

            content_length = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            body = self.rfile.read(
                content_length
            )

            data = json.loads(
                body.decode("utf-8")
            )

            expression = str(
                data.get(
                    "expression",
                    ""
                )
            )

            result = calculate_expression(
                expression
            )

            if isinstance(result, float):

                if result.is_integer():
                    result = int(result)

            self.send_json(
                {
                    "result": result
                },
                200
            )

        except ZeroDivisionError as error:

            self.send_json(
                {
                    "error": str(error)
                },
                400
            )

        except Exception as error:

            self.send_json(
                {
                    "error": str(error)
                },
                400
            )

    def do_GET(self):

        self.send_json(
            {
                "message":
                "Calculadora Python funcionando"
            },
            200
        )

    def send_json(self, data, status):

        response = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(status)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Content-Length",
            str(len(response))
        )

        self.end_headers()

        self.wfile.write(response)

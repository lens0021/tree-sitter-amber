const KEYWORDS = [
    "if",
    "loop",
    "ref",
    "return",
    "fun",
    "else",
    "then",
    "break",
    "continue",
    "and",
    "or",
    "not",
    "let",
    "pub",
    "main",
    "echo",
    "fun",
    "import",
    "as",
    "in",
    "fail",
    "failed",
    "status",
    "silent",
    "nameof",
    "is",
    "unsafe",
];

// TODO: Ifs, loops, ternary exp

module.exports = grammar({
    name: "amber",

    extras: $ => [$.comment, /\s/],

    rules: {
        source_file: $ => repeat($._global_statement),

        _global_statement: $ => seq(choice(
            $.import_statement,
            $.function_definition,
            $.main_block,
            $._statement
        ), optional(";")),

        _statement: $ => prec.left(seq(choice(
            $.function_control_flow,
            $.if_cond,
            $.if_chain,
            $.loop_infinite,
            $.loop_iter,
            $.loop_control_flow,
            $.variable_init,
            $.variable_assignment,
            $._expression
        ), optional(";"))),

        block: $ => choice(
            seq("{", repeat($._statement), "}"),
            seq(":", $._statement)
        ),

        main_block: $ => seq(
            "main",
            optional(seq("(", $.variable, ")")),
            $.block
        ),

        function_parameter_list_item: $ => prec.left(seq(
            $.variable,
            optional(seq(
                ":",
                $.type_name
            )),
            optional(seq(
                "=",
                $._expression
            ))
        )),

        function_parameter_list: $ => seq(
            "(",
            optional(seq(
                $.function_parameter_list_item,
                repeat(seq(",", $.function_parameter_list_item)
            ))),
            ")"
        ),

        function_definition: $ => seq(
            optional("pub"),
            "fun",
            field("name", $.variable),
            field("parameters", $.function_parameter_list),
            field("body", $.block),
        ),

        function_control_flow: $ => seq(choice("return", "fail"), $._expression),

        import_item: $ => seq($.variable, optional(seq("as", $.variable))),
        import_statement: $ => seq(
            optional("pub"),
            "import",
            choice(
                seq(
                    "{",
                    optional(seq($.import_item, repeat(seq(",", $.import_item)))),
                    "}",
                    "from",
                    $.string,
                ),
                seq("*", "from", $.string),
            ),
        ),

        parameter_list: $ => seq(
            "(",
            optional(seq($.variable, repeat(seq(",", $.variable)))),
            ")",
        ),

        subscript: $ => seq("[", $._expression, "]"),
        subscript_expression: $ => prec(5, seq($._expression, $.subscript)),

        variable_init: $ => seq("let", $.variable, "=", $._expression),
        variable_assignment: $ => prec(3, seq($.variable, optional($.subscript), "=", $._expression)),

        if_cond: $ => prec.left(seq("if", $._expression, $.block, optional(seq("else", $.block)))),
        if_chain: $ => seq("if", "{", optional(repeat(seq($._expression, $.block))), optional(seq("else", $.block)), "}"),
        if_ternary: $ => prec.left(1, seq($._expression, "then", $._expression, "else", $._expression)),

        loop_infinite: $ => seq("loop", $.block),
        loop_iter: $ => seq("loop", $.variable, optional(seq(",", $.variable)), "in", $._expression, $.block),
        loop_control_flow: $ => choice("break", "continue"),

        boolean: $ => token(choice("true", "false")),
        null: $ => token("null"),
        number: $ => token(seq(optional(/[-+]/), /\d+(\.\d+)?/)),
        type_name: $ => choice("Text", "Num", "Bool", "Null"),
        status: $ => token("status"),

        function_call: $ => seq(
            $.variable,
            seq(
                "(",
                optional(
                    seq($._expression, repeat(seq(",", $._expression))),
                ),
                ")",
                optional($.handler),
            ),
        ),

        unop: $ => prec(3, choice(
            seq('-', $._expression),
            seq('not', $._expression),
            seq('unsafe', $._expression),
            seq('silent', $._expression),
            seq('nameof', $._expression),
        )),

        binop: $ => choice(
            prec.left(2, seq($._expression, '*', $._expression)),
            prec.left(2, seq($._expression, '/', $._expression)),
            prec.left(1, seq($._expression, '+', $._expression)),
            prec.left(1, seq($._expression, '-', $._expression)),
            prec.left(1, seq($._expression, '%', $._expression)),
            prec.left(1, seq($._expression, '>', $._expression)),
            prec.left(1, seq($._expression, '<', $._expression)),
            prec.left(1, seq($._expression, '>=', $._expression)),
            prec.left(1, seq($._expression, '<=', $._expression)),
            prec.left(1, seq($._expression, '==', $._expression)),
            prec.left(1, seq($._expression, '!=', $._expression)),
        ),

        keyword_binop: $ => choice(
            prec.left(2, seq($._expression, 'and', $._expression)),
            prec.left(2, seq($._expression, 'or', $._expression)),
            prec.left(1, seq($._expression, 'is', $._expression)),
            prec.left(1, seq($._expression, 'as', $._expression)),
        ),

        variable: $ => /\w+/,

        string: $ => seq(
            '"',
            repeat(
                choice(
                    $.escape_sequence,
                    $.interpolation,
                    token.immediate(/[^\\"{}]+/),
                ),
            ),
            '"',
        ),

        handler_failed: $ => seq("failed", $.block),
        handler_propagation: $ => token("?"),
        handler: $ => choice(
            $.handler_failed,
            $.handler_propagation
        ),

        escape_sequence: $ => token(seq("\\", optional(/./))),
        interpolation: $ => seq("{", $._expression, "}"),
        command: $ => seq(
            "$",
            repeat(
                choice(
                    $.escape_sequence,
                    $.command_option,
                    $.interpolation,
                    token.immediate(/[^\\${}-]+/),
                ),
            ),
            "$",
            optional($.handler)
        ),

        command_option: $ => token(seq(/-{1,2}/, optional(/[A-Za-z0-9-_]+/))),
        comment: $ => token(seq("//", /.*/)),
        _expression: $ => choice(
            $.boolean,
            $.null,
            $.number,
            $.type_name,
            $.function_call,
            $.if_ternary,
            $.unop,
            $.binop,
            $.keyword_binop,
            $.subscript_expression,
            $.command,
            $.string,
            $.variable,
        ),
    },
});
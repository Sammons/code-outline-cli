<Outline>
# Ultra-compressed code outline for LLM consumption
# Format: type_name line_number (indented for hierarchy)
# Numbers after elements are 1-indexed line numbers for navigation
# Import/export names joined with underscore: imp_parseArgs
# Variables and functions show actual names after type

# Path variables
<p1>=packages/parser/src/extractors
<p2>=packages/formatter/src
<p3>=packages/cli/src
# Type abbreviations
imp=import_statement
exp=export_statement
ifc=interface_declaration
ib=interface_body
cls=class_declaration
cb=class_body
mth=method_definition
blk=statement_block
let=lexical_declaration
var=variable_declarator
pub=public_field_definition
fn=function_declaration
typ=type_alias_declaration
for=for_statement
# Files
<p3>/cli-argument-parser.ts (235L)
imp_parseArgs 1
imp_isAbsolute 2
imp_existsSync 3
imp_OutputFormat 4
imp_validateFormat_validateDept... 5
imp_version 9
exp_CliOptions 11
 ifc_CliOptions 11
  ib 11
exp_ParsedArgs 20
 ifc_ParsedArgs 20
  ib 20
exp_CLIArgumentError 25
 cls_CLIArgumentError 25
  cb 25
   mth_constructor 26
    blk 26
exp_CLIArgumentParser 32
 cls_CLIArgumentParser 32
  cb 32
   mth_safeExtractValue 34
    blk 34
     blk 36
     blk 39
   mth_validateAndThrow 47
    blk 50
     blk 51
   mth_printHelp 60
    blk 60
   mth_printVersion 107
    blk 107
   mth_parse 111
    blk 111
     let_const { values, positionals } 112
      var_{ values, positionals } 112
     blk 148
     blk 153
     blk 158
     let_const formatValidation 163
      var_formatValidation 163
     let_const format 164
      var_format 164
     let_const depthValidation 167
      var_depthValidation 167
     let_const depth 168
      var_depth 168
     let_const namedOnly 170
      var_namedOnly 170
     let_const llmtext 174
      var_llmtext 174
     let_const finalFormat 177
      var_finalFormat 177
     let_const pattern 179
      var_pattern 179
     blk 186
      let_const pathSegments 188
       var_pathSegments 188
      let_const hasMultipleSegments 191
       var_hasMultipleSegments 191
      let_const endsWithCommonExtension 192
       var_endsWithCommonExtension 192
      let_const isAbsolutePath 196
       var_isAbsolutePath 196
      let_const fileExists 197
       var_fileExists 197
      let_const shouldWarn 200
       var_shouldWarn 200
      blk 206
<p3>/cli-orchestrator.ts (49L)
imp_CLIArgumentParser_CLIArgume... 1
imp_FileProcessor_FileProcessor... 2
imp_CLIOutputHandler 3
exp_CLIOrchestrator 5
 cls_CLIOrchestrator 5
  cb 5
   pub_argumentParser 6
   pub_fileProcessor 7
   mth_constructor 9
    blk 9
   mth_run 14
    blk 14
     blk 15
      let_const { options, pattern } 17
       var_{ options, pattern } 17
      let_const files 20
       var_files 20
      let_const results 23
       var_results 23
      let_const outputHandler 30
       var_outputHandler 30
<p3>/cli-orchestrator.unit.test.ts (190L)
imp_describe_it_expect_vi_befor... 1
let_const mockConsoleError 23
 var_mockConsoleError 23
imp_CLIOrchestrator 28
imp_CLIArgumentParser_CLIArgume... 29
imp_FileProcessor_FileProcessor... 30
imp_CLIOutputHandler 31
<p3>/cli-output-handler.ts (17L)
imp_OutputFormat 1
imp_Formatter 2
imp_ProcessedFile 3
exp_CLIOutputHandler 5
 cls_CLIOutputHandler 5
  cb 5
   pub_formatter 6
   mth_constructor 8
    blk 8
   mth_formatAndOutput 12
    blk 12
     let_const output 13
      var_output 13
<p3>/cli.integration.test.ts (436L)
imp_describe_it_expect_vi_befor... 1
imp_spawn 2
imp_resolve 3
imp_writeFileSync_mkdirSync_rmSync 4
fn_runCLI 7
 blk 9
<p3>/cli.ts (16L)
imp_CLIOrchestrator 3
fn_main 5
 blk 5
  let_const orchestrator 6
   var_orchestrator 6
<p3>/cli.unit.test.ts (515L)
imp_describe_it_expect_vi_befor... 1
imp_parseArgs 2
imp_fg 3
imp_resolve 4
imp_Parser_validateFormat_valid... 5
imp_Formatter 10
imp_ProcessedFile 11
let_const mockParseArgs 20
 var_mockParseArgs 20
let_const mockFg 21
 var_mockFg 21
let_const mockResolve 22
 var_mockResolve 22
let_const mockParser 23
 var_mockParser 23
let_const mockFormatter 24
 var_mockFormatter 24
let_const mockValidateFormat 25
 var_mockValidateFormat 25
let_const mockValidateDepthValue 26
 var_mockValidateDepthValue 26
let_let mockConsoleLog 29
 var_mockConsoleLog 29
let_let mockConsoleError 30
 var_mockConsoleError 30
imp_CLIArgumentParser_CLIArgume... 33
imp_FileProcessor_FileProcessor... 34
imp_CLIOutputHandler 35
<p3>/file-processor.ts (75L)
imp_resolve 1
imp_fg 2
imp_NodeInfo 3
imp_Parser 4
exp_ProcessedFile 6
 ifc_ProcessedFile 6
  ib 6
exp_FileProcessorError 11
 cls_FileProcessorError 11
  cb 11
   mth_constructor 12
    blk 12
exp_FileProcessor 18
 cls_FileProcessor 18
  cb 18
   pub_parser 19
   mth_constructor 21
    blk 21
   mth_findFiles 25
    blk 25
     let_const files 26
      var_files 26
     blk 31
   mth_parseFile 40
    blk 44
     blk 45
      let_const outline 46
       var_outline 46
   mth_processFiles 62
    blk 66
     let_const parsePromises 68
      var_parsePromises 68
<p3>/index.ts (55L)
exp_CLIOrchestrator 2
exp_CLIArgumentParser 5
exp_FileProcessor 6
exp_CLIOutputHandler 7
exp_parseFiles 10
 fn_parseFiles 10
  blk 18
   let_const { FileProcessor } 19
    var_{ FileProcessor } 19
   let_const fileProcessor 21
    var_fileProcessor 21
   let_const patternArray 22
    var_patternArray 22
   let_const allFiles 25
    var_allFiles 25
   let_const uniqueFiles 32
    var_uniqueFiles 32
   let_const results 35
    var_results 35
   let_const { Formatter } 42
    var_{ Formatter } 42
   let_const formatter 43
    var_formatter 43
   let_const output 45
    var_output 45
   blk 47
    let_const fs 48
     var_fs 48
<p3>/test.ts (51L)
ifc_User 3
 ib 3
typ_UserRole 9
enum_declaration_Status 11
 enum_body 11
cls_UserService 17
 cb 17
  pub_users 18
  mth_constructor 20
   blk 20
  mth_getUser 22
   blk 22
  mth_addUser 26
   blk 26
  mth_userCount 30
   blk 30
fn_validateEmail 35
 blk 35
  let_const regex 36
   var_regex 36
let_const createUser 40
 var_createUser 40
exp_UserService_validateEmail_c... 48
exp_User_UserRole 49
exp_Status 50
<p2>/formatter.test.ts (614L)
imp_describe_it_expect_beforeEach 1
imp_Formatter 2
imp_NodeInfo 3
fn_stripAnsi 6
 blk 6
let_const sampleNodeInfo 12
 var_sampleNodeInfo 12
let_const sampleResults 48
 var_sampleResults 48
<p2>/formatter.ts (415L)
imp_*asYAML 1
imp_pc 2
imp_relative 3
imp_readFileSync 4
imp_NodeInfo 5
exp_Formatter 7
 cls_Formatter 7
  cb 7
   mth_constructor 8
    blk 11
   mth_format 13
    blk 13
     let_const cwd 15
      var_cwd 15
     let_const resultsWithRelativePaths 16
      var_resultsWithRelativePaths 16
   mth_getRelativePath 38
    blk 38
     let_const relativePath 39
      var_relativePath 39
   mth_formatJSON 44
    blk 50
     let_const filtered 51
      var_filtered 51
     let_const enhanced 53
      var_enhanced 53
   mth_formatYAML 61
    blk 67
     let_const filtered 68
      var_filtered 68
     let_const enhanced 70
      var_enhanced 70
   mth_addFileToNodes 78
    blk 81
     let_const enhancedNode 82
      var_enhancedNode 82
     blk 85
     blk 90
   mth_formatASCII 99
    blk 105
     let_const output 106
      var_output 106
   mth_formatNodeASCII 129
    blk 134
     let_const lines 135
      var_lines 135
     let_const indentStr 136
      var_indentStr 136
     let_const prefix 137
      var_prefix 137
     let_let nodeStr 139
      var_nodeStr 139
     let_const typeColors 141
      var_typeColors 141
     let_const colorFn 153
      var_colorFn 153
     blk 155
     blk 166
     blk 172
      for 173
       let_let i 173
        var_i 173
       blk 173
        let_const child 174
         var_child 174
        let_const isLast 175
         var_isLast 175
        let_const childPrefix 176
         var_childPrefix 176
   mth_formatLLMText 186
    blk 192
     let_const filtered 193
      var_filtered 193
     let_const pathMap 196
      var_pathMap 196
     let_const pathCounter 197
      var_pathCounter 197
     let_const processedPaths 198
      var_processedPaths 198
     let_const nodeTypeMap 205
      var_nodeTypeMap 205
     let_const output 208
      var_output 208
     blk 220
     blk 228
   mth_extractCommonPaths 259
    blk 263
     let_const pathParts 265
      var_pathParts 265
     let_const worthwhilePaths 276
      var_worthwhilePaths 276
   mth_createNodeTypeAbbreviations 293
    blk 295
     let_const typeFrequency 296
      var_typeFrequency 296
     let_const countTypes 298
      var_countTypes 298
     let_const abbreviations 310
      var_abbreviations 310
     let_const commonAbbreviations 311
      var_commonAbbreviations 311
   mth_compressPath 337
    blk 337
     let_let compressed 338
      var_compressed 338
     let_const sortedPaths 341
      var_sortedPaths 341
   mth_formatNodeUltraCompressed 355
    blk 359
     blk 360
     let_const lines 364
      var_lines 364
   mth_getFileLineCount 406
    blk 406
     blk 407
      let_const content 408
       var_content 408
<p2>/index.ts (2L)
exp 1
packages/parser/src/ast-traverser.ts (296L)
imp_TreeSitterParser 1
imp_NodeInfo 2
imp_isContainerType_isStructura... 3
imp_NameExtractor 8
imp_TreeUtils 9
exp_TraversalOptions 14
 ifc_TraversalOptions 14
  ib 14
exp_ASTTraverser 24
 cls_ASTTraverser 24
  cb 24
   pub_nameExtractor 25
   mth_constructor 27
    blk 27
   mth_extractNodeInfo 39
    blk 44
     let_const info 45
      var_info 45
     blk 47
   mth_createNodeInfo 59
    blk 62
     let_const info 63
      var_info 63
     let_const name 75
      var_name 75
     blk 76
   mth_shouldIncludeNode 87
    blk 90
     let_const hasName 91
      var_hasName 91
     let_const isStructural 92
      var_isStructural 92
     blk 95
     blk 100
   mth_processChildren 112
    blk 118
     blk 119
      let_const children 120
       var_children 120
      blk 126
   mth_handleSpecialCases 136
    blk 142
     blk 144
     blk 149
      let_const children 150
       var_children 150
   mth_shouldProcessForNamedOnly 166
    blk 169
   mth_canHaveChildren 177
    blk 181
   mth_handleNamedOnlyResult 189
    blk 192
     blk 193
     blk 197
   mth_extractChildren 209
    blk 214
     let_const children 215
      var_children 215
     for 217
      let_let i 217
       var_i 217
      blk 217
       let_const child 218
        var_child 218
       blk 219
       let_const nextDepth 223
        var_nextDepth 223
       let_const childInfo 227
        var_childInfo 227
       blk 229
   mth_calculateNextDepth 241
    blk 244
   mth_shouldIncludeChild 255
    blk 257
   mth_countNodes 268
    blk 268
   mth_findNodesByType 275
    blk 275
   mth_findNodesByName 282
    blk 282
   mth_filterNodes 289
    blk 292
packages/parser/src/file-reader.ts (54L)
imp_readFile 1
imp_extname 2
exp_SupportedFileType 7
 typ_SupportedFileType 7
exp_FileReader 12
 cls_FileReader 12
  cb 12
   mth_readFile 19
    blk 19
   mth_getFileType 29
    blk 29
     let_const ext 30
      var_ext 30
   mth_isSupported 49
    blk 49
     let_const ext 50
      var_ext 50
packages/parser/src/index.ts (13L)
exp 2
exp 5
exp 6
exp 7
exp 8
exp 11
exp 12
packages/parser/src/name-extractor.ts (28L)
imp_TreeSitterParser 1
imp_ExtractorRegistry 2
exp_NameExtractor 7
 cls_NameExtractor 7
  cb 7
   pub_registry 8
   mth_constructor 10
    blk 10
   mth_extractName 20
    blk 23
     let_const extractor 24
      var_extractor 24
packages/parser/src/parser-factory.ts (90L)
imp_TreeSitterParser 1
imp_JavaScript 2
imp_SupportedFileType 3
let_const TypeScript 6
 var_TypeScript 6
let_const TSX 8
 var_TSX 8
exp_ParserFactory 14
 cls_ParserFactory 14
  cb 14
   pub_instance 15
   pub_jsParser 16
   pub_tsParser 17
   pub_tsxParser 18
   mth_constructor 20
    blk 20
   mth_getInstance 34
    blk 34
     blk 35
   mth_getParser 46
    blk 46
   mth_parseSource 66
    blk 69
     let_const parser 70
      var_parser 70
   mth_reset 78
    blk 78
packages/parser/src/parser.test.ts (589L)
imp_describe_it_expect_beforeEach 1
imp_Parser 2
imp_NodeInfo 3
imp_TreeUtils 4
imp_readFileSync 5
imp_resolve 6
packages/parser/src/parser.ts (116L)
imp_NodeInfo 1
imp_FileReader 2
imp_ParserFactory 3
imp_ASTTraverser_typeTraversalO... 4
imp_NameExtractor 5
exp_Parser 11
 cls_Parser 11
  cb 11
   pub_fileReader 12
   pub_parserFactory 13
   pub_astTraverser 14
   pub_nameExtractor 15
   mth_constructor 17
    blk 17
   mth_parseFile 31
    blk 35
     blk 36
      blk 38
      let_const content 43
       var_content 43
      let_const fileType 46
       var_fileType 46
      let_const tree 47
       var_tree 47
      let_const options 50
       var_options 50
   mth_parseSource 75
    blk 80
     blk 81
      let_const tree 82
       var_tree 82
      let_const options 84
       var_options 84
   mth_getSupportedExtensions 103
    blk 103
   mth_isFileSupported 112
    blk 112
packages/parser/src/tree-utils.test.ts (778L)
imp_describe_it_expect 1
imp_TreeUtils 2
imp_NodeInfo_TreeVisitor_NodePr... 3
fn_createNode 6
 blk 10
fn_createSimpleTree 21
 blk 21
fn_createDeepTree 33
 blk 33
  let_let current 34
   var_current 34
  for 35
   let_let i 35
    var_i 35
   blk 35
fn_createComplexTree 42
 blk 42
packages/parser/src/tree-utils.ts (341L)
imp_NodeInfo 5
exp_NodeInfo 8
exp_TreeVisitor 13
 typ_TreeVisitor 13
exp_NodePredicate 22
 typ_NodePredicate 22
exp_TreeUtils 31
 cls_TreeUtils 31
  cb 31
   mth_countNodes 35
    blk 35
     let_let count 36
      var_count 36
     blk 37
   mth_findNodesByType 49
    blk 49
     let_const results 50
      var_results 50
     blk 52
     blk 56
   mth_findNodesByName 68
    blk 68
     let_const results 69
      var_results 69
     blk 71
     blk 75
   mth_filterNodes 87
    blk 92
     let_const results 93
      var_results 93
     blk 95
     blk 99
   mth_traverseTree 113
    blk 118
     let_const results 119
      var_results 119
     let_const result 121
      var_result 121
     blk 122
     blk 126
   mth_getNodeDepth 140
    blk 140
     let_const findDepth 141
      var_findDepth 141
   mth_getAllLeaves 164
    blk 164
     let_const leaves 165
      var_leaves 165
     blk 167
   mth_getMaxDepth 181
    blk 181
     let_let maxDepth 182
      var_maxDepth 182
     blk 184
   mth_getNodesAtDepth 196
    blk 200
     blk 201
     blk 205
      let_const results 206
       var_results 206
   mth_hasChildren 221
    blk 221
   mth_isLeaf 228
    blk 228
   mth_findFirst 235
    blk 240
     blk 241
     blk 245
   mth_getPath 265
    blk 265
     let_const findPath 266
      var_findPath 266
   mth_mapTree 291
    blk 296
     let_const mappedNode 297
      var_mappedNode 297
     blk 307
      let_const nodeInfoLike 309
       var_nodeInfoLike 309
   mth_cloneTree 321
    blk 321
     let_const cloned 322
      var_cloned 322
     blk 328
     blk 332
packages/parser/src/types.test.ts (967L)
imp_describe_it_expect 1
imp_//TypeguardsisNamedNode_isU... 2
packages/parser/src/types.ts (299L)
exp 6
 let_const NODE_TYPES 6
  var_NODE_TYPES 6
exp_NodeType 68
 typ_NodeType 68
exp 71
 let_const CONTAINER_TYPES 71
  var_CONTAINER_TYPES 71
exp_ContainerType 103
 typ_ContainerType 103
exp 106
 let_const STRUCTURAL_TYPES 106
  var_STRUCTURAL_TYPES 106
exp_StructuralType 116
 typ_StructuralType 116
exp 119
 let_const INSIGNIFICANT_TYPES 119
  var_INSIGNIFICANT_TYPES 119
exp_InsignificantType 132
 typ_InsignificantType 132
exp_Position 135
 ifc_Position 135
  ib 135
exp_NodeInfo 141
 ifc_NodeInfo 141
  ib 141
exp_isNamedNode 150
 fn_isNamedNode 150
  blk 152
exp_isUnnamedNode 157
 fn_isUnnamedNode 157
  blk 159
exp_isContainerType 164
 fn_isContainerType 164
  blk 164
exp_isStructuralType 169
 fn_isStructuralType 169
  blk 169
exp_isInsignificantType 174
 fn_isInsignificantType 174
  blk 174
exp_validateDepth 179
 fn_validateDepth 179
  blk 179
   blk 180
   let_const parsed 184
    var_parsed 184
   blk 185
exp 193
 let_const OUTPUT_FORMATS 193
  var_OUTPUT_FORMATS 193
exp_OutputFormat 194
 typ_OutputFormat 194
exp_isValidOutputFormat 197
 fn_isValidOutputFormat 197
  blk 197
exp_ParseResult 202
 ifc_ParseResult 202
  ib 202
exp_ParserConfig 208
 ifc_ParserConfig 208
  ib 208
exp_ParserError 214
 cls_ParserError 214
  cb 214
   mth_constructor 215
    blk 218
exp_FileReaderError 224
 cls_FileReaderError 224
  cb 224
   mth_constructor 225
    blk 228
exp_UnsupportedFileTypeError 234
 cls_UnsupportedFileTypeError 234
  cb 234
   mth_constructor 235
    blk 235
exp_ValidationResult 244
 ifc_ValidationResult 244
  ib 244
exp_Validator 251
 typ_Validator 251
exp_validateFormat 254
 fn_validateFormat 254
  blk 256
   blk 257
   blk 264
exp_validateDepthValue 278
 fn_validateDepthValue 278
  blk 278
   blk 279
   blk 286
    let_const validated 287
     var_validated 287
<p1>/base-extractor.ts (120L)
imp_TreeSitterParser 1
exp_BaseExtractor 6
 ifc_BaseExtractor 6
  ib 6
exp_NodeUtils 28
 cls_NodeUtils 28
  cb 28
   mth_getNodeText 32
    blk 35
   mth_findChildByType 42
    blk 45
     let_const typeArray 46
      var_typeArray 46
     for 48
      let_let i 48
       var_i 48
      blk 48
       let_const child 49
        var_child 49
       blk 50
   mth_findChildrenByType 60
    blk 63
     let_const typeArray 64
      var_typeArray 64
     let_const children 65
      var_children 65
     for 67
      let_let i 67
       var_i 67
      blk 67
       let_const child 68
        var_child 68
       blk 69
   mth_extractIdentifier 79
    blk 87
     let_const identifier 88
      var_identifier 88
   mth_cleanString 95
    blk 95
   mth_forEachChild 102
    blk 108
     for 109
      let_let i 109
       var_i 109
      blk 109
       let_const child 110
        var_child 110
       blk 111
        let_const result 112
         var_result 112
        blk 113
<p1>/class-extractor.ts (55L)
imp_TreeSitterParser 1
imp_BaseExtractor 2
imp_NodeUtils 3
exp_ClassExtractor 8
 cls_ClassExtractor 8
  cb 8
   mth_getSupportedTypes 9
    blk 9
   mth_extractName 13
    blk 16
   mth_extractClassName 32
    blk 35
   mth_extractInterfaceName 45
    blk 48
<p1>/extractor-registry.ts (80L)
imp_BaseExtractor 1
imp_FunctionExtractor 2
imp_ClassExtractor 3
imp_VariableExtractor 4
imp_ImportExportExtractor 5
imp_TypeExtractor 6
exp_ExtractorRegistry 11
 cls_ExtractorRegistry 11
  cb 11
   pub_instance 12
   pub_typeToExtractorMap 13
   mth_constructor 15
    blk 15
   mth_getInstance 20
    blk 20
     blk 21
   mth_initializeExtractors 30
    blk 30
     let_const extractors 31
      var_extractors 31
   mth_getExtractor 51
    blk 51
   mth_getSupportedTypes 58
    blk 58
   mth_isSupported 65
    blk 65
   mth_getAllExtractors 72
    blk 72
     let_const extractors 73
      var_extractors 73
<p1>/function-extractor.ts (109L)
imp_TreeSitterParser 1
imp_BaseExtractor 2
imp_NodeUtils 3
exp_FunctionExtractor 8
 cls_FunctionExtractor 8
  cb 8
   mth_getSupportedTypes 9
    blk 9
   mth_extractName 21
    blk 24
   mth_extractFunctionName 49
    blk 52
   mth_extractMethodName 59
    blk 62
   mth_extractArrowFunctionName 72
    blk 75
     let_const parent 76
      var_parent 76
     blk 79
      let_const pattern 80
       var_pattern 80
      blk 81
       blk 82
     blk 95
      let_const key 96
       var_key 96
      blk 100
       let_const name 101
        var_name 101
<p1>/import-export-extractor.ts (206L)
imp_TreeSitterParser 1
imp_BaseExtractor 2
imp_NodeUtils 3
exp_ImportExportExtractor 8
 cls_ImportExportExtractor 8
  cb 8
   mth_getSupportedTypes 9
    blk 9
   mth_extractName 13
    blk 16
   mth_extractImportName 33
    blk 36
     let_const importClause 37
      var_importClause 37
     blk 39
   mth_extractImportClauseNames 50
    blk 53
     let_const imports 54
      var_imports 54
   mth_getImportItemName 69
    blk 72
   mth_extractImportSource 96
    blk 99
     let_const stringNode 100
      var_stringNode 100
   mth_extractExportName 109
    blk 112
     let_const exportClause 114
      var_exportClause 114
     blk 115
     let_const exportedDeclaration 120
      var_exportedDeclaration 120
     blk 133
      blk 135
      let_const identifier 140
       var_identifier 140
     let_const defaultKeyword 148
      var_defaultKeyword 148
     blk 152
   mth_extractInternalModuleName 162
    blk 165
     let_let foundNamespace 167
      var_foundNamespace 167
     for 169
      let_let i 169
       var_i 169
      blk 169
       let_const child 170
        var_child 170
       blk 171
       let_const childText 175
        var_childText 175
       blk 178
       blk 187
     for 193
      let_let i 193
       var_i 193
      blk 193
       let_const child 194
        var_child 194
       blk 198
<p1>/index.ts (9L)
exp_BaseExtractor_NodeUtils 2
exp_FunctionExtractor 3
exp_ClassExtractor 4
exp_VariableExtractor 5
exp_ImportExportExtractor 6
exp_TypeExtractor 7
exp_ExtractorRegistry 8
<p1>/type-extractor.ts (98L)
imp_TreeSitterParser 1
imp_BaseExtractor 2
imp_NodeUtils 3
exp_TypeExtractor 8
 cls_TypeExtractor 8
  cb 8
   mth_getSupportedTypes 9
    blk 9
   mth_extractName 20
    blk 23
   mth_extractTypeAliasName 45
    blk 48
   mth_extractEnumName 58
    blk 61
   mth_extractNamespaceOrModuleName 71
    blk 74
     let_const name 76
      var_name 76
     blk 80
     for 85
      let_let i 85
       var_i 85
      blk 85
       let_const child 86
        var_child 86
       blk 90
<p1>/variable-extractor.ts (158L)
imp_TreeSitterParser 1
imp_BaseExtractor 2
imp_NodeUtils 3
exp_VariableExtractor 8
 cls_VariableExtractor 8
  cb 8
   mth_getSupportedTypes 9
    blk 9
   mth_extractName 22
    blk 25
   mth_extractVariableDeclaratorName 53
    blk 56
     let_const pattern 58
      var_pattern 58
     blk 59
      blk 60
   mth_extractDeclarationName 76
    blk 79
     let_const keyword 81
      var_keyword 81
     blk 82
     let_const declarators 86
      var_declarators 86
     blk 101
      let_const keywordText 102
       var_keywordText 102
   mth_extractPropertyName 111
    blk 114
   mth_extractPairName 124
    blk 127
     let_const key 128
      var_key 128
     blk 132
      let_const name 133
       var_name 133
   mth_extractCallExpressionName 142
    blk 145
     let_const func 147
      var_func 147
     blk 148
      blk 149
</Outline>
